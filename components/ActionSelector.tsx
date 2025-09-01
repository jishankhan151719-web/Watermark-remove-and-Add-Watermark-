import React from 'react';

interface ActionSelectorProps {
  onSelect: (mode: 'remove' | 'add') => void;
}

const ActionCard: React.FC<{ title: string; description: string; onClick: () => void; icon: React.ReactNode }> = ({ title, description, onClick, icon }) => (
    <button
        onClick={onClick}
        className="w-full sm:w-1/2 p-8 border-2 border-gray-200 rounded-xl text-left hover:border-orange-500 hover:bg-orange-50 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
    >
        <div className="flex items-start">
            <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                {icon}
            </div>
            <div className="ml-5">
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                <p className="mt-1 text-gray-500">{description}</p>
            </div>
        </div>
    </button>
);


const ActionSelector: React.FC<ActionSelectorProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Welcome to Watermark Bear!</h2>
      <p className="text-lg text-gray-600 mb-8 text-center">What would you like to do today?</p>
      <div className="w-full flex flex-col sm:flex-row gap-6">
        <ActionCard 
            title="Remove a Watermark"
            description="Upload a video to simulate the watermark removal process."
            onClick={() => onSelect('remove')}
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59" /></svg>
            }
        />
        <ActionCard 
            title="Add a Watermark"
            description="Customize and apply a text watermark to your video."
            onClick={() => onSelect('add')}
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
            }
        />
      </div>
    </div>
  );
};

export default ActionSelector;
