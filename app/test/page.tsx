import React from 'react';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">CSS Test Page</h1>
        
        <div className="space-y-6">
          {/* Typography */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-700">Typography</h2>
            <p className="text-gray-600">This is a paragraph with some text to test the typography styles.</p>
            <p className="text-sm text-gray-500">Smaller text with a different color.</p>
          </div>
          
          {/* Buttons */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-700">Buttons</h2>
            <div className="flex space-x-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                Primary Button
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                Secondary Button
              </button>
            </div>
          </div>
          
          {/* Cards */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-700">Cards</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium text-lg">Card Title</h3>
                <p className="text-gray-600 mt-2">This is a card with some sample content.</p>
              </div>
              <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="font-medium text-lg">Another Card</h3>
                <p className="text-gray-600 mt-2">This card has a light gray background.</p>
              </div>
            </div>
          </div>
          
          {/* Dark Mode Test */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-700">Dark Mode</h2>
            <div className="p-4 rounded-lg bg-gray-800 text-white">
              <p>This section simulates dark mode. If you see white text on dark background, dark mode is working.</p>
              <button className="mt-2 px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600">
                Dark Mode Button
              </button>
            </div>
          </div>
          
          {/* Tailwind CSS Version */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              If you can see styled components above, Tailwind CSS is working correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
