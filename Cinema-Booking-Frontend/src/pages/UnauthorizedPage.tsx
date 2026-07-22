import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-dark-950">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="text-center max-w-md relative z-10"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
          <div className="relative inline-block mb-6">
            <div className="absolute -inset-4 bg-gradient-to-b from-primary-500/15 to-transparent rounded-2xl blur-xl opacity-60" />
            <div className="relative w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-primary-400" />
            </div>
          </div>
        </motion.div>
        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-3xl font-display font-bold mb-4 text-neutral-50"
        >
          Unauthorized
        </motion.h1>
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-neutral-400 mb-8"
        >
          This route requires admin access. Please sign in with an admin account.
        </motion.p>
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link to="/" className="btn btn-secondary">Back Home</Link>
          <Link to="/login" className="btn btn-primary">Sign In</Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
