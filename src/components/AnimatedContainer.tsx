'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface AnimatedContainerProps {
  children: React.ReactNode;
}

export default function AnimatedContainer({ children }: AnimatedContainerProps) {
  return (
    <motion.div
      className="space-y-6 p-4 sm:p-6 lg:p-8"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}
