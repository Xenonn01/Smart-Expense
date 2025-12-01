import { useState } from "react";
import { supabase } from "./supabaseClient";
import trackerLogo from "./assets/logo-tracker.png"; // your logo
import "./App.css";

export default function Auth({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) alert(error.message);
      else onLogin(data.session);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (error) alert(error.message);
      else {
        alert("Account created! Please log in.");
        setIsLogin(true);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-[rgba(245,245,245,0.5)]">
      <div className="bg-white p-10 rounded-2xl shadow-md w-full max-w-md text-center border border-gray-200">

        {/* Logo */}
        <img src={trackerLogo} alt="SmartExpense" className="w-16 mx-auto mb-2" />

        <h2 className="text-xl font-semibold text-gray-800 mb-1">SmartExpense</h2>

        <p className="text-gray-500 text-sm mb-5">
          Track your expenses and manage your finances
        </p>

        {/* Toggle Buttons */}
        <div className="flex bg-gray-200 rounded-full p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`w-1/2 py-2 rounded-full text-sm font-medium transition
              ${isLogin ? "bg-white shadow" : "text-gray-500"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`w-1/2 py-2 rounded-full text-sm font-medium transition
              ${!isLogin ? "bg-white shadow" : "text-gray-500"}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">

          {!isLogin && (
            <div>
              <label className="text-sm text-gray-700">Name:</label>
              <input
                type="text"
                className="w-full mt-1 p-2 rounded-md bg-gray-100 text-black outline-none border border-gray-300 focus:ring-2 focus:ring-gray-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-sm text-gray-700">Email:</label>
            <input
              type="email"
              className="w-full mt-1 p-2 rounded-md bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-700">Password:</label>
            <input
              type="password"
              className="w-full mt-1 p-2 rounded-md bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-gray-400 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-full mt-4 hover:bg-gray-800 transition"
          >
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
