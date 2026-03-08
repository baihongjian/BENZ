'use client';

import { useState, useEffect, useCallback } from 'react';

// study1.db 学校类型
interface Study1School {
  id: number;
  school_code: string;
  name: string;
  deviation: number | null;
  sex_type: string;
  prefecture: string;
  category: string;
  website: string;
  region: string;
  first_year_total: string | null;
  annual_fee: string | null;
  source_url: string | null;
}

// yotsuya.db 学校类型
interface YotsuyaSchool {
  id: number;
  school_id: string;
  name: string;
  deviation: number;
  sex: string;
  exam_dates: string;
  webURL: string | null;
}

interface Exam {
  id: number;
  exam_name: string;
  exam_date: string;
  start_time: string;
  source_url: string;
}

// 关联学校类型
interface LinkedSchool {
  name: string;
  study1: Study1School | null;
  yotsuya: YotsuyaSchool | null;
  matchedBy: 'exact' | 'fuzzy' | 'study1' | 'yotsuya';
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'study1' | 'yotsuya' | 'linked'>('study1');

  // study1.db 数据
  const [study1Schools, setStudy1Schools] = useState<Study1School[]>([]);
  const [selectedStudy1School, setSelectedStudy1School] = useState<Study1School | null>(null);
  const [study1Exams, setStudy1Exams] = useState<Exam[]>([]);

  // yotsuya.db 数据
  const [yotsuyaSchools, setYotsuyaSchools] = useState<YotsuyaSchool[]>([]);
  const [selectedYotsuyaSchool, setSelectedYotsuyaSchool] = useState<YotsuyaSchool | null>(null);

  // 关联数据
  const [linkedSchools, setLinkedSchools] = useState<LinkedSchool[]>([]);
  const [linkedFilter, setLinkedFilter] = useState<'all' | 'exact' | 'fuzzy' | 'both' | 'study1_only' | 'yotsuya_only'>('all');
  const [regionFilter, setRegionFilter] = useState<'all' | '関東' | '関西'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'deviation'>('name');

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');
  const [yotsuyaFetchLoading, setYotsuyaFetchLoading] = useState(false);
  const [yotsuyaFetchMessage, setYotsuyaFetchMessage] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // 筛选条件
  const [filters, setFilters] = useState({
    minDeviation: '',
    maxDeviation: '',
    sex: 'all',
    region: 'all',
    search: '',
  });

  // 统计信息
  const [stats, setStats] = useState<{
    total: number;
    withDeviation: number;
    withoutDeviation: number;
    kansai: number;
    kanto: number;
  } | null>(null);

  // 获取 study1.db 学校列表
  const fetchStudy1Schools = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '9999' });

      if (filters.minDeviation) params.append('minDeviation', filters.minDeviation);
      if (filters.maxDeviation) params.append('maxDeviation', filters.maxDeviation);
      if (filters.sex !== 'all') params.append('sex', filters.sex);
      if (filters.region !== 'all') params.append('region', filters.region);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/02-edu/002-zhongshou/schools-study1?${params}`);
      const data = await response.json();

      if (data.success) {
        setStudy1Schools(data.data);
      }
    } catch (error) {
      console.error('获取学校列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // 获取 yotsuya.db 学校列表
  const fetchYotsuyaSchools = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '9999' });

      if (filters.minDeviation) params.append('minDeviation', filters.minDeviation);
      if (filters.maxDeviation) params.append('maxDeviation', filters.maxDeviation);
      if (filters.sex !== 'all') params.append('sex', filters.sex);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/02-edu/002-zhongshou/school-list?${params}`);
      const data = await response.json();

      if (data.success) {
        setYotsuyaSchools(data.data);
      }
    } catch (error) {
      console.error('获取学校列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // 获取统计信息
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/02-edu/002-zhongshou/schools-study1?limit=9999`);
      const data = await response.json();
      if (data.success) {
        const schools = data.data;
        const withDev = schools.filter((s: Study1School) => s.deviation !== null && s.deviation > 0).length;
        const withoutDev = schools.filter((s: Study1School) => !s.deviation || s.deviation === 0).length;
        const kansai = schools.filter((s: Study1School) => s.region === '関西').length;
        const kanto = schools.filter((s: Study1School) => s.region === '関東').length;

        setStats({
          total: data.pagination.total,
          withDeviation: withDev,
          withoutDeviation: withoutDev,
          kansai,
          kanto,
        });
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  }, []);

  // 触发获取 study1 数据的脚本
  const triggerStudy1Fetch = async (region: 'kanto' | 'kansai') => {
    setFetchLoading(true);
    setFetchMessage('开始获取数据...');
    try {
      const response = await fetch(`/api/02-edu/002-zhongshou/fetch-study1?region=${region}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setFetchMessage(data.message || '获取成功!');
        // 刷新数据
        await fetchStudy1Schools();
        await fetchStats();
      } else {
        setFetchMessage(`获取失败: ${data.error}`);
      }
    } catch (error) {
      setFetchMessage(`获取失败: ${error}`);
    } finally {
      setFetchLoading(false);
    }
  };

  // 触发获取 yotsuya 数据的脚本
  const triggerYotsuyaFetch = async () => {
    setYotsuyaFetchLoading(true);
    setYotsuyaFetchMessage('开始获取数据...');
    try {
      const response = await fetch(`/api/02-edu/002-zhongshou/fetch-yotsuya`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setYotsuyaFetchMessage(data.message || '获取成功!');
        // 刷新数据
        await fetchYotsuyaSchools();
      } else {
        setYotsuyaFetchMessage(`获取失败: ${data.error}`);
      }
    } catch (error) {
      setYotsuyaFetchMessage(`获取失败: ${error}`);
    } finally {
      setYotsuyaFetchLoading(false);
    }
  };

  // 同步偏差值：将 yotsuya 的偏差值更新到 study1
  const syncDeviation = async () => {
    if (!linkedSchools || linkedSchools.length === 0) {
      setSyncMessage('没有可同步的数据');
      return;
    }

    // 获取当前筛选后的学校（模糊匹配且有关东区域的）
    const filteredSchools = linkedSchools.filter(s => {
      // 匹配类型筛选
      let matchTypeFiltered = true;
      if (linkedFilter === 'fuzzy') matchTypeFiltered = s.matchedBy === 'fuzzy';

      // 区域筛选 - 只从 study1 中获取区域信息
      let regionFiltered = true;
      if (regionFilter !== 'all' && s.study1) {
        regionFiltered = s.study1.region === regionFilter;
      }

      // 必须同时有 study1 和 yotsuya 数据
      const hasBoth = !!s.study1 && !!s.yotsuya;

      return matchTypeFiltered && regionFiltered && hasBoth;
    });

    if (filteredSchools.length === 0) {
      setSyncMessage('当前筛选条件下没有可同步的数据');
      return;
    }

    setSyncLoading(true);
    setSyncMessage(`开始同步 ${filteredSchools.length} 所学校的偏差值...`);

    let successCount = 0;
    let failCount = 0;

    for (const school of filteredSchools) {
      if (!school.study1 || !school.yotsuya) continue;

      try {
        const response = await fetch('/api/02-edu/002-zhongshou/update-study1-deviation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            school_code: school.study1.school_code,
            deviation: school.yotsuya.deviation,
          }),
        });

        const result = await response.json();
        if (result.success) {
          successCount++;
        } else {
          failCount++;
          console.error(`更新失败: ${school.study1.name}`, result.error);
        }
      } catch (error) {
        failCount++;
        console.error(`更新失败: ${school.study1.name}`, error);
      }
    }

    setSyncLoading(false);
    setSyncMessage(`同步完成: 成功 ${successCount} 所, 失败 ${failCount} 所`);

    // 刷新数据
    await fetchBothDatabases();
  };

  // 监听 tab 切换和数据变化
  useEffect(() => {
    if (activeTab === 'study1') {
      fetchStudy1Schools();
    } else if (activeTab === 'yotsuya') {
      fetchYotsuyaSchools();
    } else if (activeTab === 'linked') {
      // 关联视图：获取两个数据库的数据并关联
      fetchBothDatabases();
    }
  }, [activeTab, fetchStudy1Schools, fetchYotsuyaSchools]);

  // 标准化学校名称（去除后缀）
  const normalizeName = (name: string): string => {
    // 常见后缀列表
    const suffixes = [
      '中学校',
      '中等部',
      '中学',
      '高等部',
      '高校',
      '学校',
      '学園',
    ];

    let normalized = name;
    for (const suffix of suffixes) {
      if (normalized.endsWith(suffix)) {
        normalized = normalized.slice(0, -suffix.length);
        break; // 只去除一个最长的后缀
      }
    }
    return normalized;
  };

  // 从 URL 中提取域名（去除 www. 和末尾斜杠）
  const extractDomain = (url: string | null | undefined): string | null => {
    if (!url) return null;
    try {
      // 如果没有协议，添加 https://
      const urlStr = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(urlStr);
      let domain = urlObj.hostname.toLowerCase();
      // 去除 www. 前缀
      if (domain.startsWith('www.')) {
        domain = domain.slice(4);
      }
      return domain;
    } catch {
      return null;
    }
  };

  // 获取两个数据库并关联（支持模糊匹配）
  const fetchBothDatabases = async () => {
    setLoading(true);
    try {
      // 并行获取两个数据库
      const [study1Res, yotsuyaRes] = await Promise.all([
        fetch(`/api/02-edu/002-zhongshou/schools-study1?limit=9999`),
        fetch(`/api/02-edu/002-zhongshou/school-list?limit=9999`),
      ]);

      const study1Data = await study1Res.json();
      const yotsuyaData = await yotsuyaRes.json();

      const study1List: Study1School[] = study1Data.success ? study1Data.data : [];
      const yotsuyaList: YotsuyaSchool[] = yotsuyaData.success ? yotsuyaData.data : [];

      // 创建标准化名称映射（用于模糊匹配）
      const study1NormalizedMap = new Map<string, Study1School[]>();
      study1List.forEach((s) => {
        const normalized = normalizeName(s.name);
        if (!study1NormalizedMap.has(normalized)) {
          study1NormalizedMap.set(normalized, []);
        }
        study1NormalizedMap.get(normalized)!.push(s);
      });

      const yotsuyaNormalizedMap = new Map<string, YotsuyaSchool[]>();
      yotsuyaList.forEach((s) => {
        const normalized = normalizeName(s.name);
        if (!yotsuyaNormalizedMap.has(normalized)) {
          yotsuyaNormalizedMap.set(normalized, []);
        }
        yotsuyaNormalizedMap.get(normalized)!.push(s);
      });

      // 用于跟踪已匹配的学校
      const matchedYotsuya = new Set<string>();
      const matchedStudy1 = new Set<string>();

      // 创建关联数据
      const linked: LinkedSchool[] = [];

      // 首先处理精确匹配（两个数据库中名称完全相同的学校）
      study1List.forEach((study1) => {
        const yotsuya = yotsuyaList.find(y => y.name === study1.name);
        if (yotsuya) {
          linked.push({
            name: study1.name,
            study1,
            yotsuya,
            matchedBy: 'exact',
          });
          matchedStudy1.add(study1.name);
          matchedYotsuya.add(yotsuya.name);
        }
      });

      console.log(`\n=== After Exact Match ===`);
      console.log(`  Matched study1: ${matchedStudy1.size}`);
      console.log(`  Matched yotsuya: ${matchedYotsuya.size}`);

      // 处理模糊匹配 - 对标准化后的名称进行匹配
      let fuzzyMatchCount = 0;
      study1NormalizedMap.forEach((study1Schools, normalizedName) => {
        const yotsuyaSchools = yotsuyaNormalizedMap.get(normalizedName);
        if (!yotsuyaSchools || yotsuyaSchools.length === 0) return;

        // 匹配所有未匹配的组合
        study1Schools.forEach((study1) => {
          // 如果已精确匹配，跳过
          if (matchedStudy1.has(study1.name)) return;

          // 找一个未匹配的 yotsuya 学校
          const yotsuya = yotsuyaSchools.find(y => !matchedYotsuya.has(y.name));
          if (!yotsuya) return;

          // 进行模糊匹配
          linked.push({
            name: `${study1.name} ↔ ${yotsuya.name}`,
            study1,
            yotsuya,
            matchedBy: 'fuzzy',
          });
          matchedStudy1.add(study1.name);
          matchedYotsuya.add(yotsuya.name);
          fuzzyMatchCount++;
        });
      });

      console.log(`\n=== After Fuzzy Match ===`);
      console.log(`  Fuzzy matches: ${fuzzyMatchCount}`);
      console.log(`  Total matched study1: ${matchedStudy1.size}`);
      console.log(`  Total matched yotsuya: ${matchedYotsuya.size}`);

      // 处理 URL 域名匹配 - 对未匹配的学校进行 URL 域名匹配
      const study1DomainMap = new Map<string, Study1School[]>();
      study1List.forEach((s) => {
        // 跳过已匹配的
        if (matchedStudy1.has(s.name)) return;
        const domain = extractDomain(s.website);
        if (domain) {
          if (!study1DomainMap.has(domain)) {
            study1DomainMap.set(domain, []);
          }
          study1DomainMap.get(domain)!.push(s);
        }
      });

      const yotsuyaDomainMap = new Map<string, YotsuyaSchool[]>();
      yotsuyaList.forEach((s) => {
        // 跳过已匹配的
        if (matchedYotsuya.has(s.name)) return;
        const domain = extractDomain(s.webURL);
        if (domain) {
          if (!yotsuyaDomainMap.has(domain)) {
            yotsuyaDomainMap.set(domain, []);
          }
          yotsuyaDomainMap.get(domain)!.push(s);
        }
      });

      // URL 域名匹配
      let urlMatchCount = 0;
      study1DomainMap.forEach((study1Schools, domain) => {
        const yotsuyaSchools = yotsuyaDomainMap.get(domain);
        if (!yotsuyaSchools || yotsuyaSchools.length === 0) return;

        // 匹配所有未匹配的组合
        study1Schools.forEach((study1) => {
          // 如果已匹配，跳过
          if (matchedStudy1.has(study1.name)) return;

          // 找一个未匹配的 yotsuya 学校
          const yotsuya = yotsuyaSchools.find(y => !matchedYotsuya.has(y.name));
          if (!yotsuya) return;

          // 进行 URL 匹配
          linked.push({
            name: `${study1.name} ↔ ${yotsuya.name}`,
            study1,
            yotsuya,
            matchedBy: 'fuzzy', // 复用 fuzzy 类型
          });
          matchedStudy1.add(study1.name);
          matchedYotsuya.add(yotsuya.name);
          urlMatchCount++;
        });
      });

      console.log(`\n=== After URL Match ===`);
      console.log(`  URL matches: ${urlMatchCount}`);
      console.log(`  Total matched study1: ${matchedStudy1.size}`);
      console.log(`  Total matched yotsuya: ${matchedYotsuya.size}`);

      // 添加仅在 study1 中的未匹配学校
      study1List.forEach((s) => {
        if (!matchedStudy1.has(s.name)) {
          linked.push({
            name: s.name,
            study1: s,
            yotsuya: null,
            matchedBy: 'study1',
          });
        }
      });

      // 添加仅在 yotsuya 中的未匹配学校
      yotsuyaList.forEach((s) => {
        if (!matchedYotsuya.has(s.name)) {
          linked.push({
            name: s.name,
            study1: null,
            yotsuya: s,
            matchedBy: 'yotsuya',
          });
        }
      });

      // 按名称排序
      linked.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

      setLinkedSchools(linked);
    } catch (error) {
      console.error('获取关联数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 获取 study1 学校详情
  const fetchStudy1Detail = async (schoolCode: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/02-edu/002-zhongshou/schools-study1/${schoolCode}`);
      const data = await response.json();

      if (data.success) {
        setSelectedStudy1School(data.data.school);
        setStudy1Exams(data.data.exams || []);
      }
    } catch (error) {
      console.error('获取学校详情失败:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  // 筛选条件变更
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 重置筛选
  const resetFilters = () => {
    setFilters({
      minDeviation: '',
      maxDeviation: '',
      sex: 'all',
      region: 'all',
      search: '',
    });
  };

  // 关闭详情弹窗
  const closeDetail = () => {
    setSelectedStudy1School(null);
    setStudy1Exams([]);
    setSelectedYotsuyaSchool(null);
  };

  // 当前显示的学校列表
  const currentSchools = activeTab === 'study1' ? study1Schools : yotsuyaSchools;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>中学校データ管理画面</h1>

      {/* 标签页切换 */}
      <div style={tabContainerStyle}>
        <button
          onClick={() => setActiveTab('study1')}
          style={activeTab === 'study1' ? activeTabStyle : tabStyle}
        >
          study1.db (関東・関西)
        </button>
        <button
          onClick={() => setActiveTab('yotsuya')}
          style={activeTab === 'yotsuya' ? activeTabStyle : tabStyle}
        >
          yotsuya.db (四谷大塚)
        </button>
        <button
          onClick={() => setActiveTab('linked')}
          style={activeTab === 'linked' ? activeTabStyle : tabStyle}
        >
          关联对比
        </button>
      </div>

      {/* 统计信息 */}
      {activeTab === 'study1' && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          {stats && (
            <>
              <div style={cardStyle}>
                <div style={cardNumberStyle}>{stats.total}</div>
                <div>学校总数</div>
              </div>
              <div style={cardStyle}>
                <div style={cardNumberStyle}>{stats.withDeviation}</div>
                <div>有偏差值</div>
              </div>
              <div style={cardStyle}>
                <div style={cardNumberStyle}>{stats.withoutDeviation}</div>
                <div>无偏差值</div>
              </div>
              <div style={cardStyle}>
                <div style={cardNumberStyle}>{stats.kanto}</div>
                <div>関東</div>
              </div>
              <div style={cardStyle}>
                <div style={cardNumberStyle}>{stats.kansai}</div>
                <div>関西</div>
              </div>
            </>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <button
              onClick={() => triggerStudy1Fetch('kanto')}
              disabled={fetchLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: fetchLoading ? '#ccc' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: fetchLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {fetchLoading ? '获取中...' : '获取関東数据'}
            </button>
            <button
              onClick={() => triggerStudy1Fetch('kansai')}
              disabled={fetchLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: fetchLoading ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: fetchLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {fetchLoading ? '获取中...' : '获取関西数据'}
            </button>
          </div>
        </div>
      )}

      {/* 获取数据消息 */}
      {fetchMessage && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: fetchMessage.includes('失败') ? '#ffebee' : '#e8f5e9',
          borderRadius: '4px',
          color: fetchMessage.includes('失败') ? '#c62828' : '#2e7d32',
        }}>
          {fetchMessage}
        </div>
      )}

      {/* yotsuya 数据操作 */}
      {activeTab === 'yotsuya' && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={triggerYotsuyaFetch}
              disabled={yotsuyaFetchLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: yotsuyaFetchLoading ? '#ccc' : '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: yotsuyaFetchLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {yotsuyaFetchLoading ? '获取中...' : '获取四谷大塚数据'}
            </button>
          </div>
        </div>
      )}

      {/* yotsuya 获取数据消息 */}
      {yotsuyaFetchMessage && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: yotsuyaFetchMessage.includes('失败') ? '#ffebee' : '#e8f5e9',
          borderRadius: '4px',
          color: yotsuyaFetchMessage.includes('失败') ? '#c62828' : '#2e7d32',
        }}>
          {yotsuyaFetchMessage}
        </div>
      )}

      {/* 筛选条件 */}
      <div style={filterContainerStyle}>
        <div style={filterRowStyle}>
          <div style={filterItemStyle}>
            <label>偏差值范围:</label>
            <input
              type="number"
              placeholder="最小"
              value={filters.minDeviation}
              onChange={(e) => handleFilterChange('minDeviation', e.target.value)}
              style={inputStyle}
            />
            <span> - </span>
            <input
              type="number"
              placeholder="最大"
              value={filters.maxDeviation}
              onChange={(e) => handleFilterChange('maxDeviation', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={filterItemStyle}>
            <label>性别:</label>
            <select
              value={filters.sex}
              onChange={(e) => handleFilterChange('sex', e.target.value)}
              style={selectStyle}
            >
              <option value="all">全部</option>
              <option value="男子">男子校</option>
              <option value="女子">女子校</option>
              <option value="共通">共学校</option>
            </select>
          </div>

          {activeTab === 'study1' && (
            <div style={filterItemStyle}>
              <label>区域:</label>
              <select
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                style={selectStyle}
              >
                <option value="all">全部</option>
                <option value="関東">関東</option>
                <option value="関西">関西</option>
              </select>
            </div>
          )}

          <div style={filterItemStyle}>
            <label>搜索:</label>
            <input
              type="text"
              placeholder="学校名..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={inputSearchStyle}
            />
          </div>

          <button onClick={resetFilters} style={resetButtonStyle}>
            重置
          </button>
        </div>
      </div>

      {/* 结果信息 */}
      <div style={{ marginBottom: '10px' }}>
        共 {currentSchools.length} 所学校
      </div>

      {/* 学校列表 */}
      {loading ? (
        <div>加载中...</div>
      ) : activeTab === 'study1' ? (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>偏差值</th>
              <th style={thStyle}>学校名</th>
              <th style={thStyle}>区域</th>
              <th style={thStyle}>所在地</th>
              <th style={thStyle}>类型</th>
              <th style={thStyle}>性别</th>
              <th style={thStyle}>操作</th>
            </tr>
          </thead>
          <tbody>
            {study1Schools.map((school) => (
              <tr key={school.id} style={trStyle}>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {school.deviation || '-'}
                </td>
                <td style={tdStyle}>
                  <a
                    href={school.website || school.source_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0066cc', textDecoration: 'none' }}
                  >
                    {school.name}
                  </a>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{school.region}</td>
                <td style={tdStyle}>{school.prefecture}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{school.category}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{school.sex_type}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <button
                    onClick={() => fetchStudy1Detail(school.school_code)}
                    style={buttonStyle}
                  >
                    详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>偏差值</th>
              <th style={thStyle}>学校名</th>
              <th style={thStyle}>性别</th>
              <th style={thStyle}>考试日期</th>
              <th style={thStyle}>操作</th>
            </tr>
          </thead>
          <tbody>
            {yotsuyaSchools.map((school) => (
              <tr key={school.id} style={trStyle}>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{school.deviation}</td>
                <td style={tdStyle}>{school.name}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{school.sex}</td>
                <td style={tdStyle}>{school.exam_dates || '-'}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <button
                    onClick={() => setSelectedYotsuyaSchool(school)}
                    style={buttonStyle}
                  >
                    详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 关联对比视图 */}
      {activeTab === 'linked' && (
        <>
          {/* 关联筛选 */}
          <div style={filterContainerStyle}>
            <div style={filterRowStyle}>
              <div style={filterItemStyle}>
                <label>匹配:</label>
                <select
                  value={linkedFilter}
                  onChange={(e) => setLinkedFilter(e.target.value as any)}
                  style={selectStyle}
                >
                  <option value="all">全部</option>
                  <option value="exact">精确匹配</option>
                  <option value="fuzzy">模糊匹配</option>
                  <option value="both">两库都有</option>
                  <option value="study1_only">仅 study1.db</option>
                  <option value="yotsuya_only">仅 yotsuya.db</option>
                </select>
              </div>

              <div style={filterItemStyle}>
                <label>区域:</label>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value as any)}
                  style={selectStyle}
                >
                  <option value="all">全部</option>
                  <option value="関東">関東</option>
                  <option value="関西">関西</option>
                </select>
              </div>

              <div style={filterItemStyle}>
                <label>排序:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={selectStyle}
                >
                  <option value="name">按名称</option>
                  <option value="deviation">按偏差值</option>
                </select>
              </div>

              {/* 同步偏差值按钮 - 仅在模糊匹配模式下显示 */}
              {linkedFilter === 'fuzzy' && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={syncDeviation}
                    disabled={syncLoading}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: syncLoading ? '#ccc' : '#9C27B0',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: syncLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {syncLoading ? '同步中...' : '同步偏差值到 study1'}
                  </button>
                </div>
              )}

              {/* 当前筛选结果的统计 */}
              {(() => {
                const filteredSchools = linkedSchools.filter(s => {
                  // 匹配类型筛选
                  let matchTypeFiltered = true;
                  if (linkedFilter === 'exact') matchTypeFiltered = s.matchedBy === 'exact';
                  else if (linkedFilter === 'fuzzy') matchTypeFiltered = s.matchedBy === 'fuzzy';
                  else if (linkedFilter === 'both') matchTypeFiltered = !!s.study1 && !!s.yotsuya;
                  else if (linkedFilter === 'study1_only') matchTypeFiltered = !!!!s.study1 && !s.yotsuya;
                  else if (linkedFilter === 'yotsuya_only') matchTypeFiltered = !s.study1 && !!s.yotsuya;

                  // 区域筛选
                  let regionFiltered = true;
                  if (regionFilter !== 'all' && s.study1) {
                    regionFiltered = s.study1.region === regionFilter;
                  }

                  return matchTypeFiltered && regionFiltered;
                });

                const fuzzyCount = filteredSchools.filter(s => s.matchedBy === 'fuzzy').length;
                const exactCount = filteredSchools.filter(s => s.matchedBy === 'exact').length;
                const study1OnlyCount = filteredSchools.filter(s => s.matchedBy === 'study1').length;
                const yotsuyaOnlyCount = filteredSchools.filter(s => s.matchedBy === 'yotsuya').length;

                return (
                  <div style={{ marginLeft: '20px', color: '#666' }}>
                    当前筛选结果: <strong>{filteredSchools.length}</strong> 所学校
                    (精确匹配: {exactCount} |
                    模糊匹配: {fuzzyCount} |
                    仅 study1: {study1OnlyCount} |
                    仅 yotsuya: {yotsuyaOnlyCount})
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 同步消息 */}
          {syncMessage && (
            <div style={{
              padding: '10px',
              marginBottom: '20px',
              backgroundColor: syncMessage.includes('失败') || syncMessage.includes('没有') ? '#ffebee' : '#e8f5e9',
              borderRadius: '4px',
              color: syncMessage.includes('失败') || syncMessage.includes('没有') ? '#c62828' : '#2e7d32',
            }}>
              {syncMessage}
            </div>
          )}

          {/* 关联表格 */}
          {loading ? (
            <div>加载中...</div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '25%' }}>学校名</th>
                  <th style={{ ...thStyle, width: '15%', background: '#e3f2fd' }}>study1.db 偏差值</th>
                  <th style={{ ...thStyle, width: '10%', background: '#e3f2fd' }}>区域</th>
                  <th style={{ ...thStyle, width: '10%', background: '#e3f2fd' }}>性别</th>
                  <th style={{ ...thStyle, width: '15%', background: '#fff3e0' }}>yotsuya.db 偏差值</th>
                  <th style={{ ...thStyle, width: '10%', background: '#fff3e0' }}>性别</th>
                  <th style={{ ...thStyle, width: '15%' }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {linkedSchools
                  .filter(s => {
                    // 匹配类型筛选
                    let matchTypeFiltered = true;
                    if (linkedFilter === 'exact') matchTypeFiltered = s.matchedBy === 'exact';
                    else if (linkedFilter === 'fuzzy') matchTypeFiltered = s.matchedBy === 'fuzzy';
                    else if (linkedFilter === 'both') matchTypeFiltered = !!s.study1 && !!s.yotsuya;
                    else if (linkedFilter === 'study1_only') matchTypeFiltered = !!s.study1 && !s.yotsuya;
                    else if (linkedFilter === 'yotsuya_only') matchTypeFiltered = !!!s.study1 && !!s.yotsuya;

                    // 区域筛选 - 只从 study1 中获取区域信息
                    let regionFiltered = true;
                    if (regionFilter !== 'all' && s.study1) {
                      regionFiltered = s.study1.region === regionFilter;
                    }

                    return matchTypeFiltered && regionFiltered;
                  })
                  .sort((a, b) => {
                    if (sortBy === 'deviation') {
                      const devA = a.study1?.deviation || a.yotsuya?.deviation || 0;
                      const devB = b.study1?.deviation || b.yotsuya?.deviation || 0;
                      return devB - devA; // 从大到小
                    }
                    return a.name.localeCompare(b.name, 'ja');
                  })
                  .map((school) => (
                    <tr key={`${school.study1?.school_code || ''}-${school.yotsuya?.school_id || ''}-${school.name}`} style={trStyle}>
                      <td style={tdStyle}>{school.name}</td>
                      <td style={{ ...tdStyle, background: '#e3f2fd', textAlign: 'center' }}>
                        {school.study1?.deviation || '-'}
                      </td>
                      <td style={{ ...tdStyle, background: '#e3f2fd', textAlign: 'center' }}>
                        {school.study1?.region || '-'}
                      </td>
                      <td style={{ ...tdStyle, background: '#e3f2fd', textAlign: 'center' }}>
                        {school.study1?.sex_type || '-'}
                      </td>
                      <td style={{ ...tdStyle, background: '#fff3e0', textAlign: 'center' }}>
                        {school.yotsuya?.deviation || '-'}
                      </td>
                      <td style={{ ...tdStyle, background: '#fff3e0', textAlign: 'center' }}>
                        {school.yotsuya?.sex || '-'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {school.matchedBy === 'exact' ? (
                          <span style={statusBothStyle}>精确匹配</span>
                        ) : school.matchedBy === 'fuzzy' ? (
                          <span style={statusFuzzyStyle}>模糊匹配</span>
                        ) : school.study1 ? (
                          <span style={statusStudy1OnlyStyle}>仅 study1</span>
                        ) : (
                          <span style={statusYotsuyaOnlyStyle}>仅 yotsuya</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* study1 学校详情弹窗 */}
      {selectedStudy1School && (
        <div style={modalOverlayStyle} onClick={closeDetail}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>{selectedStudy1School.name}</h2>
              <button onClick={closeDetail} style={closeButtonStyle}>✕</button>
            </div>

            {detailLoading ? (
              <div>加载中...</div>
            ) : (
              <>
                <div style={sectionStyle}>
                  <h3>基本信息</h3>
                  <div style={infoGridStyle}>
                    <div><strong>偏差值:</strong> {selectedStudy1School.deviation || '-'}</div>
                    <div><strong>学校类型:</strong> {selectedStudy1School.category}</div>
                    <div><strong>性别类型:</strong> {selectedStudy1School.sex_type}</div>
                    <div><strong>区域:</strong> {selectedStudy1School.region}</div>
                    <div><strong>所在地:</strong> {selectedStudy1School.prefecture}</div>
                    <div><strong>学校代码:</strong> {selectedStudy1School.school_code}</div>
                  </div>
                </div>

                {(selectedStudy1School.first_year_total || selectedStudy1School.annual_fee) && (
                  <div style={sectionStyle}>
                    <h3>学费信息</h3>
                    <div style={infoGridStyle}>
                      <div><strong>初年度纳入金:</strong> {selectedStudy1School.first_year_total || '-'}</div>
                      <div><strong>年间学费:</strong> {selectedStudy1School.annual_fee || '-'}</div>
                    </div>
                  </div>
                )}

                <div style={sectionStyle}>
                  <h3>链接</h3>
                  <div style={linkGridStyle}>
                    {selectedStudy1School.website && (
                      <div>
                        <strong>官网:</strong>{' '}
                        <a href={selectedStudy1School.website} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                          {selectedStudy1School.website}
                        </a>
                      </div>
                    )}
                    {selectedStudy1School.source_url && (
                      <div>
                        <strong>Source:</strong>{' '}
                        <a href={selectedStudy1School.source_url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                          {selectedStudy1School.source_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {study1Exams.length > 0 && (
                  <div style={sectionStyle}>
                    <h3>考试信息 ({study1Exams.length})</h3>
                    <table style={detailTableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>考试名</th>
                          <th style={thStyle}>日期</th>
                          <th style={thStyle}>时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {study1Exams.map((exam) => (
                          <tr key={exam.id} style={trStyle}>
                            <td style={tdStyle}>{exam.exam_name}</td>
                            <td style={tdStyle}>{exam.exam_date}</td>
                            <td style={tdStyle}>{exam.start_time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* yotsuya 学校详情弹窗 */}
      {selectedYotsuyaSchool && (
        <div style={modalOverlayStyle} onClick={closeDetail}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>{selectedYotsuyaSchool.name}</h2>
              <button onClick={closeDetail} style={closeButtonStyle}>✕</button>
            </div>

            <div style={sectionStyle}>
              <h3>基本信息</h3>
              <div style={infoGridStyle}>
                <div><strong>偏差值:</strong> {selectedYotsuyaSchool.deviation}</div>
                <div><strong>性别:</strong> {selectedYotsuyaSchool.sex}</div>
                <div><strong>学校ID:</strong> {selectedYotsuyaSchool.school_id}</div>
              </div>
            </div>

            <div style={sectionStyle}>
              <h3>考试日期</h3>
              <div>{selectedYotsuyaSchool.exam_dates || '无'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 样式
const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  marginBottom: '20px',
};

const tabStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: '#f0f0f0',
  border: 'none',
  borderRadius: '4px 4px 0 0',
  cursor: 'pointer',
  fontSize: '14px',
};

const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  background: '#0066cc',
  color: '#fff',
};

const cardStyle: React.CSSProperties = {
  background: '#f5f5f5',
  padding: '15px 25px',
  borderRadius: '8px',
  textAlign: 'center',
  minWidth: '100px',
};

const cardNumberStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#333',
};

const filterContainerStyle: React.CSSProperties = {
  background: '#f9f9f9',
  padding: '15px',
  borderRadius: '8px',
  marginBottom: '20px',
};

const filterRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '15px',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const filterItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
};

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  width: '80px',
};

const inputSearchStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  width: '150px',
};

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
};

const resetButtonStyle: React.CSSProperties = {
  padding: '6px 15px',
  background: '#666',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px',
};

const thStyle: React.CSSProperties = {
  background: '#f0f0f0',
  padding: '10px',
  textAlign: 'left',
  borderBottom: '2px solid #ddd',
};

const tdStyle: React.CSSProperties = {
  padding: '10px',
  borderBottom: '1px solid #eee',
};

const trStyle: React.CSSProperties = {
  transition: 'background 0.2s',
};

const buttonStyle: React.CSSProperties = {
  padding: '4px 12px',
  background: '#0066cc',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalContentStyle: React.CSSProperties = {
  background: '#fff',
  padding: '25px',
  borderRadius: '8px',
  maxWidth: '600px',
  width: '90%',
  maxHeight: '80vh',
  overflowY: 'auto',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  color: '#666',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '20px',
  paddingBottom: '15px',
  borderBottom: '1px solid #eee',
};

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '10px',
};

const linkGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const linkStyle: React.CSSProperties = {
  color: '#0066cc',
  textDecoration: 'none',
  wordBreak: 'break-all',
};

const detailTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
};

const statusBothStyle: React.CSSProperties = {
  padding: '3px 8px',
  background: '#4caf50',
  color: '#fff',
  borderRadius: '4px',
  fontSize: '11px',
};

const statusStudy1OnlyStyle: React.CSSProperties = {
  padding: '3px 8px',
  background: '#2196f3',
  color: '#fff',
  borderRadius: '4px',
  fontSize: '11px',
};

const statusYotsuyaOnlyStyle: React.CSSProperties = {
  padding: '3px 8px',
  background: '#ff9800',
  color: '#fff',
  borderRadius: '4px',
  fontSize: '11px',
};

const statusFuzzyStyle: React.CSSProperties = {
  padding: '3px 8px',
  background: '#9c27b0',
  color: '#fff',
  borderRadius: '4px',
  fontSize: '11px',
};
