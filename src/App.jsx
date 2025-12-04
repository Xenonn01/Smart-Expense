import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";
import Auth from "./Auth";
import trackerLogo from "./assets/logo-tracker.png"; // Updated logo
import { Pencil, Trash2, LogOut } from "lucide-react";
import { 
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

export default function App() {
  const [session, setSession] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [tab, setTab] = useState("list");
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchExpenses(session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) fetchExpenses(session.user.id);
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchExpenses(userId) {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setExpenses(data);
  }

  const handleAddExpense = async () => {
    if (
      !newExpense.title ||
      !newExpense.amount ||
      !newExpense.category ||
      !newExpense.date
    ) {
      alert("Please fill all fields");
      return;
    }

    if (editingExpense) {
      // Update existing expense
      const { error } = await supabase
        .from("expenses")
        .update({
          title: newExpense.title,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          date: newExpense.date,
        })
        .eq("id", editingExpense.id);

      if (error) {
        alert("Error updating expense: " + error.message);
        return;
      }
      setEditingExpense(null);
    } else {
      // Create new expense
      const { error } = await supabase.from("expenses").insert([
        {
          user_id: session.user.id,
          title: newExpense.title,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          date: newExpense.date,
        },
      ]);

      if (error) {
        alert("Error adding expense: " + error.message);
        return;
      }
    }

    setNewExpense({ title: "", amount: "", category: "", date: "" });
    setShowModal(false);
    fetchExpenses(session.user.id);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setNewExpense({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date || new Date(expense.created_at).toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const handleCancelModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setNewExpense({ title: "", amount: "", category: "", date: "" });
  };

  async function deleteExpense(id) {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (!error) fetchExpenses(session.user.id);
  }

  if (!session) return <Auth onLogin={setSession} />;

  // Calculate totals
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const avgAmount = expenses.length > 0 ? totalAmount / expenses.length : 0;

  // Calculate This Month expenses
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonthExpenses = expenses.filter((exp) => {
    const expDate = exp.date ? new Date(exp.date) : new Date(exp.created_at);
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });
  const thisMonthAmount = thisMonthExpenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  // Calculate category breakdown for pie chart
  const categoryTotals = {};
  expenses.forEach((exp) => {
    const category = exp.category || "Others";
    categoryTotals[category] = (categoryTotals[category] || 0) + Number(exp.amount || 0);
  });
  const pieData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Calculate monthly spending for bar chart
  const monthlyTotals = {};
  expenses.forEach((exp) => {
    const expDate = exp.date ? new Date(exp.date) : new Date(exp.created_at);
    const monthKey = expDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(exp.amount || 0);
  });
  const barData = Object.entries(monthlyTotals)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA - dateB;
    })
    .slice(-6); // Show last 6 months

  // Category breakdown with percentages
  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const categoryColors = {
    Food: "#f59e0b",
    Transport: "#4f46e5",
    Shopping: "#ec4899",
    Entertainment: "#22c55e",
    Bills: "#ef4444",
    Health: "#06b6d4",
    Others: "#8b5cf6",
  };

  const COLORS = ["#4f46e5", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#8b5cf6"];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Navbar */}
      <header className="bg-white shadow-sm border-b border-gray-100 flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-2">
            <img src={trackerLogo} alt="SmartExpense" className="w-10 h-12" />
            <div className="flex flex-col">
             <h1 className="font-semibold text-lg">SmartExpense</h1>
             <span className="text-gray-600 text-sm mt-1">
               Welcome, {session.user.email.split("@")[0]}!
             </span>
            </div>
          </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 border border-gray-400 rounded-md px-4 py-2 text-sm text-black bg-white hover:bg-gray-100 transition">
            <LogOut size={16}/> LogOut
          </button> 
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Summary Cards */}
        <div className="flex flex-wrap justify-between gap-10 py-8">
          <div className="bg-white shadow rounded-xl p-5 flex-1 min-w-[200px] py-8 px-4">
            <h3 className="text-gray-500 text-sm font-medium">Total Expenses</h3>
            <p className="text-2xl font-bold mt-10">₱{totalAmount.toFixed(2)}</p>
            <p className="text-gray-400 text-sm ">
              {expenses.length} transaction{expenses.length !== 1 && "s"}
            </p>
          </div>
          <div className="bg-white shadow rounded-xl p-5 flex-1 min-w-[200px]">
            <h3 className="text-gray-500 text-sm font-medium">This Month</h3>
            <p className="text-2xl font-bold mt-10">₱{thisMonthAmount.toFixed(2)}</p>
            <p className="text-gray-400 text-sm ">
              {thisMonthExpenses.length} transaction{thisMonthExpenses.length !== 1 && "s"}
            </p>
          </div>
          <div className="bg-white shadow rounded-xl p-5 flex-1 min-w-[200px]">
            <h3 className="text-gray-500 text-sm font-medium">Average Expense</h3>
            <p className="text-2xl font-bold mt-10">₱{avgAmount.toFixed(2)}</p>
            <p className="text-gray-400 text-sm ">
              {expenses.length} transaction{expenses.length !== 1 && "s"}
            </p>
          </div>
        </div>

        {/* Expense Tracker */}
        <div className="bg-white shadow rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Expense Tracker</h2>
            <button
              onClick={() => {
                setEditingExpense(null);
                setNewExpense({ title: "", amount: "", category: "", date: "" });
                setShowModal(true);
              }}
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
            >
              + Add Expense
            </button>
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 flex justify-center items-center z-50">
              <div
                className="absolute inset-0 bg-gray-500"
                style={{ opacity: 0.7 }}
              ></div>
              <div className="bg-white rounded-xl w-full max-w-md p-6 relative z-10">
                <h2 className="text-xl font-semibold mb-2">
                  {editingExpense ? "Edit Expense" : "Add New Expense"}
                </h2>
                <h3 className="text-gray-500 mb-4">
                  {editingExpense
                    ? "Update the details of your expense"
                    : "Enter the details of your expense"}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block mb-1">Title:</label>
                    <input
                      type="text"
                      value={newExpense.title}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, title: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Amount:</label>
                    <input
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, amount: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Category:</label>
                    <select
                      value={newExpense.category}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, category: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select Category</option>
                      <option value="Food">Food</option>
                      <option value="Transport">Transport</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Bills">Bills</option>
                      <option value="Health">Health</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Date:</label>
                    <input
                      type="date"
                      value={newExpense.date}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, date: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={handleCancelModal}
                    className="px-4 py-2 border rounded hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddExpense}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
                  >
                    {editingExpense ? "Update Expense" : "+ Add Expense"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-3 mb-5 py-8">
            <button
              onClick={() => setTab("list")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                tab === "list"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Expense List
            </button>
            <button
              onClick={() => setTab("report")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                tab === "report"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Visual Report
            </button>
          </div>

          {/* Tab Content */}
          {tab === "list" ? (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2">Date</th>
                    <th className="text-left px-4 py-2">Title</th>
                    <th className="text-left px-4 py-2">Category</th>
                    <th className="text-left px-4 py-2">Amount</th>
                    <th className="text-left px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        No expenses yet. Click "+ Add Expense" to get started!
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {exp.date
                            ? new Date(exp.date).toLocaleDateString()
                            : new Date(exp.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">{exp.title}</td>
                        <td className="px-4 py-2">{exp.category}</td>
                        <td className="px-4 py-2 font-semibold">₱{Number(exp.amount).toFixed(2)}</td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            onClick={() => handleEditExpense(exp)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => deleteExpense(exp.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
           <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-8 py-8">
            {/* Pie Chart */}
            <div className="flex-1 max-w-[400px] min-w-[250px]">
             <h3 className="font-semibold mb-4 text-center">
               Distribution of your expenses across categories
             </h3>
              {pieData.length > 0 ? (
               <PieChart width={350} height={300}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                   cx="50%"
                   cy="50%"
                   outerRadius={100}
                    label
                 >
                   {pieData.map((entry, i) => (
                      <Cell
                       key={i}
                       fill={categoryColors[entry.name] || COLORS[i % COLORS.length]}
                     />
                   ))}
                 </Pie>
                 <Tooltip />
                </PieChart>
              ) : (
               <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No data to display. Add expenses to see the chart.
                </div>
             )}
           </div>

            {/* Bar Chart */}
            <div className="flex-1 max-w-[400px] min-w-[250px]">
             <h3 className="font-semibold mb-4 text-center">
               Your spending trends over time
              </h3>
             {barData.length > 0 ? (
               <BarChart
                 width={350}
                 height={300}
                 data={barData}
                 margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
               >
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#4f46e5" />
                </BarChart>
              ) : (
               <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No data to display. Add expenses to see the chart.
               </div>
             )}
            </div>
          </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white shadow rounded-xl p-6">
          <div>
            <h3 className="font-semibold mb-2">Category Breakdown</h3>
            <p className="text-gray-500 mb-4">Detailed spending by category</p>

            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.map((item) => (
                <div key={item.category} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{item.category}</span>
                    <span className="font-semibold">₱{item.amount.toFixed(2)}</span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor:
                          categoryColors[item.category] || COLORS[0],
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {item.percentage.toFixed(1)}% of total
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                No expenses yet. Add expenses to see category breakdown.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}