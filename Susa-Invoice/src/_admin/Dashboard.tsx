
import { FaFileInvoice, FaReceipt, FaChartLine, FaDownload } from 'react-icons/fa';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const Dashboard = () => {
  const data = [
    {
      title: 'Sales Invoices',
      count: 3,
      trend: 'up',
      trendValue: '12%',
      taxType: 'GST',
      taxPercentage: 18,
      icon: <FaFileInvoice className="text-emerald-500 text-xl" />,
      bgColor: 'bg-emerald-50',
      action: 'View All',
    },
    {
      title: 'Purchase Invoices',
      count: 0,
      trend: 'down',
      trendValue: '5%',
      taxType: 'GST',
      taxPercentage: 18,
      icon: <FaReceipt className="text-amber-500 text-xl" />,
      bgColor: 'bg-amber-50',
      action: 'Create New',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Dashboard Overview</h1>
          <button className="mt-4 sm:mt-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors duration-200">
            <FaDownload size={14} />
            <span>Export Report</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.map((item, index) => (
            <div
              key={index}
              className={`${item.bgColor} p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-transparent hover:border-slate-200`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">{item.title}</h2>
                  <p className="text-sm text-slate-500">Total invoices processed</p>
                </div>
                <div className={`p-3 rounded-lg ${item.bgColor.replace('50', '100')}`}>
                  {item.icon}
                </div>
              </div>

              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-3xl font-bold text-slate-800 mb-1">{item.count}</p>
                  <div className={`flex items-center text-sm ${item.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.trend === 'up' ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
                    <span>{item.trendValue} from last month</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Tax Type</p>
                  <p className="font-medium text-slate-800">{item.taxType}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <div>
                  <p className="text-sm text-slate-600">Tax Percentage</p>
                  <p className="font-medium text-slate-800">{item.taxPercentage}%</p>
                </div>
                <button className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-white shadow-xs hover:bg-slate-50 transition-colors duration-200 border border-slate-200">
                  {item.action}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Stats Section */}
        <div className="mt-8 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Quick Insights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 border border-slate-100 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-50 rounded-full">
                  <FaChartLine className="text-indigo-500" />
                </div>
                <span className="text-sm font-medium text-slate-600">Monthly Growth</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">24%</p>
            </div>
            <div className="p-4 border border-slate-100 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-50 rounded-full">
                  <FiTrendingUp className="text-emerald-500" />
                </div>
                <span className="text-sm font-medium text-slate-600">Active Clients</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">42</p>
            </div>
            <div className="p-4 border border-slate-100 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-rose-50 rounded-full">
                  <FiTrendingDown className="text-rose-500" />
                </div>
                <span className="text-sm font-medium text-slate-600">Pending Invoices</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">7</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;