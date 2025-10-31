import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import "./App.css";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

export default function App() {
  const [session, setSession] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ title: "", amount: "", category: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchExpenses(session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchExpenses(session.user.id);
    });
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

  async function addExpense() {
    const { title, amount, category } = newExpense;
    if (!title || !amount || !category) return alert("Please fill all fields");
    const { data, error } = await supabase.from("expenses").insert([
      { user_id: session.user.id, title, amount, category },
    ]);
    if (!error) {
      setNewExpense({ title: "", amount: "", category: "" });
      fetchExpenses(session.user.id);
    }
  }

  if (!session) return <Auth onLogin={setSession} />;

  const dataForChart = Object.values(
    expenses.reduce((acc, { category, amount }) => {
      acc[category] = acc[category] || { name: category, value: 0 };
      acc[category].value += Number(amount);
      return acc;
    }, {})
  );

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 via-indigo-600 to-blue-500 p-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-2xl p-8 border border-white/20 text-white">
        <h1 className="text-4xl font-bold mb-6 text-center drop-shadow-md">
          Expense Tracker
        </h1>

        {/* Add Expense Form */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <input
            className="bg-white/20 text-white placeholder-white/60 px-3 py-2 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            placeholder="Title"
            value={newExpense.title}
            onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
          />
          <input
            className="bg-white/20 text-white placeholder-white/60 px-3 py-2 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            placeholder="Amount"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
          />
          <input
            className="bg-white/20 text-white placeholder-white/60 px-3 py-2 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            placeholder="Category"
            value={newExpense.category}
            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
          />
          <button
            className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded-lg font-semibold text-white transition"
            onClick={addExpense}
          >
            Add
          </button>
        </div>

        {/* Expense List */}
        <div className="bg-white/10 rounded-xl p-4 mb-8 shadow-inner">
          <ul className="divide-y divide-white/20">
            {expenses.length === 0 ? (
              <p className="text-center text-white/70">No expenses yet</p>
            ) : (
              expenses.map((exp) => (
                <li key={exp.id} className="flex justify-between py-2 text-white/90">
                  <span>
                    {exp.title} <span className="text-white/60">({exp.category})</span>
                  </span>
                  <span className="font-semibold">₱{exp.amount}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Chart */}
        <div className="flex justify-center mb-8">
          <PieChart width={300} height={300}>
            <Pie
              data={dataForChart}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {dataForChart.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        {/* Logout */}
        <button
          onClick={() => supabase.auth.signOut()}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg w-full font-semibold transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
