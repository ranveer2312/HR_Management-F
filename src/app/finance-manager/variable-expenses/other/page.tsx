'use client';


import BackButton from '@/components/BackButton';

// ... rest of the code remains the same ...

export default function OtherExpensesPage() {
  // ... existing state and handlers ...

  return (
    <div className="container mx-auto py-8">
      <BackButton href="/finance-manager/variable-expenses" label="Back to Dashboard" />
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Other Expenses</h1>

      {/* ... rest of the JSX remains the same ... */}
    </div>
  );
} 