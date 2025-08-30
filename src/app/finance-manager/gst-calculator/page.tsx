'use client';


import { useState } from 'react';
import { CalculatorIcon } from '@heroicons/react/24/outline';




const gstRates = [
  { label: '0%', value: 0 },
  { label: '5%', value: 5 },
  { label: '12%', value: 12 },
  { label: '18%', value: 18 },
  { label: '28%', value: 28 }
];


export default function GSTCalculatorPage() {
  const [amount, setAmount] = useState('');
  const [gstRate, setGstRate] = useState('18');
  const [calculationType, setCalculationType] = useState('exclusive');
  const [results, setResults] = useState({
    baseAmount: 0,
    gstAmount: 0,
    totalAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0
  });


  const calculateGST = () => {
    const inputAmount = parseFloat(amount) || 0;
    const rate = parseFloat(gstRate) || 0;


    if (calculationType === 'exclusive') {
      const baseAmount = inputAmount;
      const gstAmount = +(baseAmount * (rate / 100)).toFixed(2);
      const totalAmount = +(baseAmount + gstAmount).toFixed(2);
     
      const cgstAmount = rate > 0 ? +(gstAmount / 2).toFixed(2) : 0;
      const sgstAmount = rate > 0 ? +(gstAmount / 2).toFixed(2) : 0;
      const igstAmount = 0;


      setResults({
        baseAmount,
        gstAmount,
        totalAmount,
        cgstAmount,
        sgstAmount,
        igstAmount
      });
    } else {
      const totalAmount = inputAmount;
      const baseAmount = +(totalAmount / (1 + rate / 100)).toFixed(2);
      const gstAmount = +(totalAmount - baseAmount).toFixed(2);
     
      const cgstAmount = rate > 0 ? +(gstAmount / 2).toFixed(2) : 0;
      const sgstAmount = rate > 0 ? +(gstAmount / 2).toFixed(2) : 0;
      const igstAmount = 0;


      setResults({
        baseAmount,
        gstAmount,
        totalAmount,
        cgstAmount,
        sgstAmount,
        igstAmount
      });
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
   
    if (name === 'amount') {
      setAmount(value);
    } else if (name === 'gstRate') {
      setGstRate(value);
    } else if (name === 'calculationType') {
      setCalculationType(value);
    }
   
    setTimeout(calculateGST, 100);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">GST Calculator</h1>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Calculate GST</h2>
           
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  min="0"
                  step="0.01"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GST Rate
                </label>
                <select
                  name="gstRate"
                  value={gstRate}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                  {gstRates.map((rate) => (
                    <option key={rate.value} value={rate.value}>{rate.label}</option>
                  ))}
                </select>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Calculation Type
                </label>
                <select
                  name="calculationType"
                  value={calculationType}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value="exclusive">GST Exclusive (Add GST to amount)</option>
                  <option value="inclusive">GST Inclusive (Extract GST from amount)</option>
                </select>
              </div>


              <button
                onClick={calculateGST}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <CalculatorIcon className="h-5 w-5 mr-2" />
                Calculate GST
              </button>
            </div>
          </div>


          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">GST Breakdown</h2>
           
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Base Amount:</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">₹{results.baseAmount.toFixed(2)}</span>
                </div>
              </div>


              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">GST Amount ({gstRate}%):</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{results.gstAmount.toFixed(2)}</span>
                </div>
              </div>


              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Total Amount:</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">₹{results.totalAmount.toFixed(2)}</span>
                </div>
              </div>


              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">GST Components:</h3>
               
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      CGST ({parseFloat(gstRate) > 0 ? (parseFloat(gstRate) / 2).toFixed(1) : '0'}%):
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">₹{results.cgstAmount.toFixed(2)}</span>
                  </div>
                 
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      SGST ({parseFloat(gstRate) > 0 ? (parseFloat(gstRate) / 2).toFixed(1) : '0'}%):
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">₹{results.sgstAmount.toFixed(2)}</span>
                  </div>
                 
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">IGST ({gstRate}%):</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">₹{results.igstAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">GST Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">GST Rates in India</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• 0% - Essential goods and services</li>
                <li>• 5% - Basic necessities</li>
                <li>• 12% - Standard rate for some goods</li>
                <li>• 18% - Standard rate for most goods and services</li>
                <li>• 28% - Luxury goods and services</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">GST Components</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• <strong>CGST:</strong> Central Goods and Services Tax</li>
                <li>• <strong>SGST:</strong> State Goods and Services Tax</li>
                <li>• <strong>IGST:</strong> Integrated Goods and Services Tax</li>
                <li>• CGST + SGST = IGST (for inter-state transactions)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
  );
}
   




 
 





