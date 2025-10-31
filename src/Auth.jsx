import { useState } from "react";
import { supabase } from "./supabaseClient";
import { motion } from "framer-motion";

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let result;

    if (isLogin) {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });

      // ✅ Only create user record if signup was successful
      if (!result.error && result.data.user) {
        const user = result.data.user;
        await supabase.from("users").insert([
          {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || "",
          },
        ]);
      }
    }

    setLoading(false);

    if (result.error) {
      alert(result.error.message);
    } else {
      onLogin(result.data.session);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 p-4">
      <motion.form
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-white/20"
      >
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          {isLogin ? "Welcome Back 👋" : "Create Account ✨"}
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-3 bg-white/20 text-white placeholder-gray-300 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 bg-white/20 text-white placeholder-gray-300 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-semibold transition-all ${
            loading
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
          }`}
        >
          {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
        </button>

        <p
          className="text-sm text-center mt-4 text-indigo-300 hover:text-indigo-200 cursor-pointer"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin
            ? "Don’t have an account? Sign up"
            : "Already have one? Log in"}
        </p>
      </motion.form>
    </div>
  );
}
