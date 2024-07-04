import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Moon, Sun, RefreshCw, Upload } from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('概覽');
  const [darkMode, setDarkMode] = useState(false);
  const [data, setData] = useState(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const parsedData = JSON.parse(content);
      processData(parsedData);
    };
    reader.readAsText(file);
  };

  const processData = (rawData) => {
    // 處理上傳的數據
    const processedData = {
      conversationTopics: countTopics(rawData),
      popularCharacters: countPopularCharacters(rawData),
      dailyActiveUsers: countDailyActiveUsers(rawData),
      averageConversationLength: calculateAverageConversationLength(rawData),
    };
    setData(processedData);
  };

  const countTopics = (rawData) => {
    const topics = {};
    rawData.forEach(conversation => {
      conversation.conversation.forEach(message => {
        if (message.role === 'user') {
          const words = message.content.toLowerCase().split(' ');
          words.forEach(word => {
            if (word.length > 3) {
              topics[word] = (topics[word] || 0) + 1;
            }
          });
        }
      });
    });
    return Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  };

  const countPopularCharacters = (rawData) => {
    const characters = {};
    rawData.forEach(conversation => {
      const character = conversation.name;
      characters[character] = (characters[character] || 0) + 1;
    });
    return Object.entries(characters)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, conversations]) => ({ name, conversations }));
  };

  const countDailyActiveUsers = (rawData) => {
    const dailyUsers = {};
    rawData.forEach(conversation => {
      const date = conversation.timestamp.split(' ')[0];
      dailyUsers[date] = (dailyUsers[date] || 0) + 1;
    });
    return Object.entries(dailyUsers).map(([date, users]) => ({ date, users }));
  };

  const calculateAverageConversationLength = (rawData) => {
    const characterLengths = {};
    rawData.forEach(conversation => {
      const character = conversation.name;
      const length = conversation.conversation.length;
      if (!characterLengths[character]) {
        characterLengths[character] = { total: 0, count: 0 };
      }
      characterLengths[character].total += length;
      characterLengths[character].count += 1;
    });
    return Object.entries(characterLengths)
      .map(([character, { total, count }]) => ({
        character,
        length: Math.round(total / count)
      }));
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className={`p-4 min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">AI對話儀表板</h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleDarkMode} 
            className={`p-2 rounded-full ${darkMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-white'} transition-colors duration-200`}
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <label className={`p-2 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors duration-200 cursor-pointer`}>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".json" />
            <Upload size={24} />
          </label>
        </div>
      </div>
      
      <div className="mb-4">
        <button 
          className={`mr-2 px-4 py-2 rounded ${activeTab === '概覽' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200'} transition-colors duration-200`}
          onClick={() => setActiveTab('概覽')}
        >
          概覽
        </button>
        <button 
          className={`px-4 py-2 rounded ${activeTab === '詳情' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200'} transition-colors duration-200`}
          onClick={() => setActiveTab('詳情')}
        >
          詳情
        </button>
      </div>

      {data ? (
        <>
          {activeTab === '概覽' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-200`}>
                <h2 className="text-xl font-semibold mb-2">對話主題</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.conversationTopics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.conversationTopics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className={`p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-200`}>
                <h2 className="text-xl font-semibold mb-2">熱門AI角色</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.popularCharacters}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="conversations" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === '詳情' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-200`}>
                <h2 className="text-xl font-semibold mb-2">每日活躍用戶</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.dailyActiveUsers}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className={`p-4 rounded shadow ${darkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-200`}>
                <h2 className="text-xl font-semibold mb-2">平均對話長度</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.averageConversationLength}>
                    <XAxis dataKey="character" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="length" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl">請上傳數據文件以查看儀表板</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
