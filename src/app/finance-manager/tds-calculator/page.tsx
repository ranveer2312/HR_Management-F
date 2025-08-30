'use client';


import { useState, useEffect, useCallback } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';


import toast, { Toaster } from 'react-hot-toast';
import { APIURL } from '@/constants/api';


interface TDSEntry {
  id: number;
  tdsFor: string;
  date: string;
  tdsRate: number;
  taxableAmount: number;
  gstAmount: number;
  tdsAmount: number;
  totalPayment: number;
  remarks: string;
}


export default function TDSCalculatorPage() {
  const API_BASE = APIURL + '/api/tds';


  const [entries, setEntries] = useState<TDSEntry[]>([]);
  const [newEntry, setNewEntry] = useState({
    tdsFor: '',
    date: '',
    tdsRate: '',
    taxableAmount: '',
    gstRate: '18',
    remarks: ''
  });


  const calculateAmounts = () => {
    const taxable = parseFloat(newEntry.taxableAmount) || 0;
    const tdsRate = parseFloat(newEntry.tdsRate) || 0;
    const gstRate = parseFloat(newEntry.gstRate) || 0;


    const tdsAmount = (taxable * tdsRate) / 100;
    const gstAmount = (taxable * gstRate) / 100;
    const totalPayment = taxable + gstAmount - tdsAmount;


    return { tdsAmount, gstAmount, totalPayment };
  };


  const { tdsAmount, gstAmount, totalPayment } = calculateAmounts();


  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEntries(data);
    } catch (error: unknown) {
      console.error('Fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Failed to fetch')) {
        toast.error('Backend server not running on port 8080');
      } else {
        toast.error('Error fetching TDS entries: ' + errorMessage);
      }
    }
  }, [API_BASE]);


  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewEntry({ ...newEntry, [name]: value });
  };


  const handleAddEntry = async () => {
    if (!newEntry.tdsFor || !newEntry.date || !newEntry.taxableAmount) {
      toast.error('Please fill in all required fields.');
      return;
    }


    const payload = {
      tdsFor: newEntry.tdsFor,
      tdsRate: parseFloat(newEntry.tdsRate),
      taxableAmount: parseFloat(newEntry.taxableAmount),
      gstRate: parseFloat(newEntry.gstRate),
      gstAmount,
      tdsAmount,
      totalPayment,
      remarks: newEntry.remarks,
      date: newEntry.date
    };


    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });


      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server error:', errorText);
        throw new Error(`Server error: ${res.status}`);
      }


      toast.success('TDS entry added successfully!');
      setNewEntry({
        tdsFor: '',
        date: '',
        tdsRate: '10',
        taxableAmount: '',
        gstRate: '18',
        remarks: ''
      });
      fetchEntries();
    } catch (error: unknown) {
      console.error('Error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Failed to fetch')) {
        toast.error('Backend server not running on port 8080');
      } else {
        toast.error('Error adding TDS entry: ' + errorMessage);
      }
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <Toaster position="top-right" />


      <div className="">
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">TDS Calculator</h1>
              <p className="text-gray-600 mt-1">Calculate and manage Tax Deducted at Source</p>
            </div>
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-sm">Live Calculator</span>
            </div>
          </div>
        </div>


      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-white/80 rounded-2xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Add New TDS Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TDS For *</label>
              <select name="tdsFor" value={newEntry.tdsFor} onChange={handleInputChange} className="w-full p-3 rounded bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none">
                <option value="">Select TDS For</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Contractor Payments">Contractor Payments</option>
                <option value="Rent">Rent</option>
                <option value="Commission">Commission</option>
                <option value="Interest on Securities">Interest on Securities</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TDS Rate (%)</label>
              <input type="number" name="tdsRate" value={newEntry.tdsRate} onChange={handleInputChange} placeholder="Enter TDS Rate" className="w-full p-3 rounded bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input type="date" name="date" value={newEntry.date} onChange={handleInputChange} className="w-full p-3 rounded bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Taxable Amount *</label>
              <input type="number" name="taxableAmount" value={newEntry.taxableAmount} onChange={handleInputChange} placeholder="Enter Taxable Amount" className="w-full p-3 rounded bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GST Rate (%)</label>
              <select name="gstRate" value={newEntry.gstRate} onChange={handleInputChange} className="w-full p-3 rounded bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none">
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GST Amount (Calculated)</label>
              <input type="text" value={`₹${gstAmount.toFixed(2)}`} readOnly className="w-full p-3 rounded bg-gray-100 text-gray-900 border border-gray-300"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TDS Amount (Calculated)</label>
              <input type="text" value={`₹${tdsAmount.toFixed(2)}`} readOnly className="w-full p-3 rounded bg-gray-100 text-gray-900 border border-gray-300"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Payment (Calculated)</label>
              <input type="text" value={`₹${totalPayment.toFixed(2)}`} readOnly className="w-full p-3 rounded bg-gray-100 text-gray-900 border border-gray-300"/>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
            <textarea name="remarks" value={newEntry.remarks} onChange={handleInputChange} placeholder="Enter any additional remarks" className="w-full p-3 rounded bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none" rows={3}/>
          </div>
          <button onClick={handleAddEntry} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center">
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Add TDS Entry
          </button>
        </div>


        <div className="bg-white/80 rounded-2xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">TDS Entries</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="py-3 px-4 text-gray-700 font-semibold">TDS FOR</th>
                  <th className="py-3 px-4 text-gray-700 font-semibold">DATE</th>
                  <th className="py-3 px-4 text-gray-700 font-semibold">TDS RATE</th>
                  <th className="py-3 px-4 text-gray-700 font-semibold">TAXABLE</th>
                  <th className="py-3 px-4 text-gray-700 font-semibold">GST</th>
                  <th className="py-3 px-4 text-gray-700 font-semibold">TDS</th>
                  <th className="py-3 px-4 text-gray-700 font-semibold">TOTAL</th>
                  <th className="py-3 px-4 text-gray-700 font-semibold">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-gray-500">No TDS entries found</td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-200 hover:bg-gray-50 text-gray-900">
                      <td className="py-3 px-4">{entry.tdsFor || 'N/A'}</td>
                      <td className="py-3 px-4">{entry.date ? new Date(entry.date).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-3 px-4">{entry.tdsRate || 0}%</td>
                      <td className="py-3 px-4">₹{(entry.taxableAmount || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">₹{(entry.gstAmount || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">₹{(entry.tdsAmount || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">₹{(entry.totalPayment || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">{entry.remarks || ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

