import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function NeopopSection() {
  return (
    <motion.div 
      className="w-full bg-black py-24"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row-reverse items-center justify-between gap-16">
          <div className="lg:w-1/2">
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              meet our bold
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                design system
              </span>
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-400 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              a new and bold design system for building fintech products that stand out
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Link 
                to="/design#top" 
                className="inline-flex items-center text-white hover:text-purple-400 transition-colors"
                onClick={() => window.scrollTo(0, 0)}
              >
                explore neopop →
              </Link>
            </motion.div>
          </div>
          
          <motion.div 
            className="lg:w-1/2"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <div className="relative">
              <img 
                src="/neopop.jpg" 
                alt="CRED NeoPOP Design System" 
                className="w-full rounded-3xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
