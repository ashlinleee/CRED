import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function AddCardModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    bank: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    creditLimit: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 16) {
      value = value.replace(/(\d{4})/g, '$1 ').trim();
      setFormData({ ...formData, cardNumber: value });
    }
  };

  const handleExpiryMonthChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 2 && parseInt(value) <= 12) {
      setFormData({ ...formData, expiryMonth: value });
    }
  };

  const handleExpiryYearChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 2) {
      setFormData({ ...formData, expiryYear: value });
    }
  };

  const handleCVVChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setFormData({ ...formData, cvv: value });
    }
  };

  const handleCreditLimitChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, creditLimit: value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-surface rounded-xl shadow-xl max-w-md w-full mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Add New Card</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-silver-light" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-silver-light mb-2">
              Card Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg focus:outline-none focus:border-primary text-white"
              placeholder="e.g., Amazon Rewards Card"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-silver-light mb-2">
              Bank Name
            </label>
            <input
              type="text"
              value={formData.bank}
              onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg focus:outline-none focus:border-primary text-white"
              placeholder="e.g., HDFC Bank"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-silver-light mb-2">
              Card Number
            </label>
            <input
              type="text"
              value={formData.cardNumber}
              onChange={handleCardNumberChange}
              className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg focus:outline-none focus:border-primary text-white"
              placeholder="**** **** **** ****"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-silver-light mb-2">
                Month
              </label>
              <input
                type="text"
                value={formData.expiryMonth}
                onChange={handleExpiryMonthChange}
                className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg focus:outline-none focus:border-primary text-white"
                placeholder="MM"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-silver-light mb-2">
                Year
              </label>
              <input
                type="text"
                value={formData.expiryYear}
                onChange={handleExpiryYearChange}
                className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg focus:outline-none focus:border-primary text-white"
                placeholder="YY"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-silver-light mb-2">
                CVV
              </label>
              <input
                type="password"
                value={formData.cvv}
                onChange={handleCVVChange}
                className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg focus:outline-none focus:border-primary text-white"
                placeholder="***"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-silver-light mb-2">
              Credit Limit
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-light">₹</span>
              <input
                type="text"
                value={formData.creditLimit}
                onChange={handleCreditLimitChange}
                className="w-full pl-8 pr-3 py-2 bg-surface border border-white/10 rounded-lg focus:outline-none focus:border-primary text-white"
                placeholder="Enter credit limit"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add Card
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
