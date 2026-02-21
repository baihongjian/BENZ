'use client';

import { useState, useEffect, useCallback } from 'react';

// 学校类型
interface School {
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

interface Exam {
  id: number;
  exam_name: string;
  exam_date: string;
  start_time: string;
  source_url: string;
}

export default function AdminPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  // 筛选条件
  const [filters, setFilters] = useState({
    minDeviation: '',
    maxDeviation: '',
    sex: 'all',
    region: 'all',
    category: 'all',
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

  // 获取学校列表
  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '9999',
      });

      if (filters.minDeviation) params.append('minDeviation', filters.minDeviation);
      if (filters.maxDeviation) params.append('maxDeviation', filters.maxDeviation);
      if (filters.sex !== 'all') params.append('sex', filters.sex);
      if (filters.region !== 'all') params.append('region', filters.region);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/02-edu/002-zhongshou/schools-study1?${params}`);
      const data = await response.json();

      if (data.success) {
        setSchools(data.data);
      }
    } catch (error) {
      console.error('获取学校列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // 获取统计信息
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/02-edu/002-zhongshou/schools-study1?limit=9999`);
        const data = await response.json();
        if (data.success) {
          const schools = data.data;
          const withDev = schools.filter((s: School) => s.deviation !== null && s.deviation > 0).length;
          const withoutDev = schools.filter((s: School) => !s.deviation || s.deviation === 0).length;
          const kansai = schools.filter((s: School) => s.region === '関西').length;
          const kanto = schools.filter((s: School) => s.region === '関東').length;

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
    };
    fetchStats();
  }, []);

  // 获取学校详情（包含考试信息）
  const fetchSchoolDetail = async (schoolCode: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/02-edu/002-zhongshou/schools-study1/${schoolCode}`);
      const data = await response.json();

      if (data.success) {
        setSelectedSchool(data.data.school);
        setExams(data.data.exams || []);
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
      category: 'all',
      search: '',
    });
  };

  // 关闭详情弹窗
  const closeDetail = () => {
    setSelectedSchool(null);
    setExams([]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>中学校データ管理画面</h1>

      {/* 统计信息 */}
      {stats && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
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
        共 {schools.length} 所学校
      </div>

      {/* 学校列表 */}
      {loading ? (
        <div>加载中...</div>
      ) : (
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
            {schools.map((school) => (
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
                    onClick={() => fetchSchoolDetail(school.school_code)}
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

      {/* 学校详情弹窗 */}
      {selectedSchool && (
        <div style={modalOverlayStyle} onClick={closeDetail}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>{selectedSchool.name}</h2>
              <button onClick={closeDetail} style={closeButtonStyle}>✕</button>
            </div>

            {detailLoading ? (
              <div>加载中...</div>
            ) : (
              <>
                {/* 基本信息 */}
                <div style={sectionStyle}>
                  <h3>基本信息</h3>
                  <div style={infoGridStyle}>
                    <div><strong>偏差值:</strong> {selectedSchool.deviation || '-'}</div>
                    <div><strong>学校类型:</strong> {selectedSchool.category}</div>
                    <div><strong>性别类型:</strong> {selectedSchool.sex_type}</div>
                    <div><strong>区域:</strong> {selectedSchool.region}</div>
                    <div><strong>所在地:</strong> {selectedSchool.prefecture}</div>
                    <div><strong>学校代码:</strong> {selectedSchool.school_code}</div>
                  </div>
                </div>

                {/* 学费信息 */}
                {(selectedSchool.first_year_total || selectedSchool.annual_fee) && (
                  <div style={sectionStyle}>
                    <h3>学费信息</h3>
                    <div style={infoGridStyle}>
                      <div><strong>初年度纳入金:</strong> {selectedSchool.first_year_total || '-'}</div>
                      <div><strong>年间学费:</strong> {selectedSchool.annual_fee || '-'}</div>
                    </div>
                  </div>
                )}

                {/* 链接 */}
                <div style={sectionStyle}>
                  <h3>链接</h3>
                  <div style={linkGridStyle}>
                    {selectedSchool.website && (
                      <div>
                        <strong>官网:</strong>{' '}
                        <a href={selectedSchool.website} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                          {selectedSchool.website}
                        </a>
                      </div>
                    )}
                    {selectedSchool.source_url && (
                      <div>
                        <strong>Source:</strong>{' '}
                        <a href={selectedSchool.source_url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                          {selectedSchool.source_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 考试信息 */}
                {exams.length > 0 && (
                  <div style={sectionStyle}>
                    <h3>考试信息 ({exams.length})</h3>
                    <table style={detailTableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>考试名</th>
                          <th style={thStyle}>日期</th>
                          <th style={thStyle}>时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exams.map((exam) => (
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
    </div>
  );
}

// 样式
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
