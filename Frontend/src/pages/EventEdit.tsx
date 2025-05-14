import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Navbar from '@/components/NavBar';
import { Loader2, XCircle } from 'lucide-react';
import { getEventForOwner } from '@/lib/api';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const EventEdit = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Fetch event data
  const {
    data: eventData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['eventEdit', eventId],
    queryFn: () => getEventForOwner(eventId || ''),
    enabled: !!eventId,
    onSuccess: (data) => {
      // Set the first category as active by default
      if (data.chartsData && data.chartsData.length > 0) {
        setActiveCategory(data.chartsData[0].categoryName);
      }
    }
  });

  console.log('Event Data:', eventData);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format chart data for the active category
  const getChartData = (categoryName: string) => {
    if (!eventData) return null;
    
    const category = eventData.chartsData.find(c => c.categoryName === categoryName);
    
    if (!category) return null;
    
    // Sort options by vote count (descending)
    const sortedOptions = [...category.options].sort((a, b) => b.voteCount - a.voteCount);
    
    // Format labels for display (especially dates)
    const formattedLabels = sortedOptions.map(opt => {
      // If category is "date" and the option name is a valid date string
      if (categoryName.toLowerCase() === "date" && !isNaN(Date.parse(opt.optionName))) {
        return formatDate(opt.optionName);
      }
      return opt.optionName;
    });
    
    return {
      labels: formattedLabels,
      datasets: [
        {
          label: 'Votes',
          data: sortedOptions.map(opt => opt.voteCount),
          backgroundColor: sortedOptions.map(opt => 
            opt.addedBy ? 'rgba(153, 102, 255, 0.6)' : 'rgba(75, 192, 192, 0.6)'
          ),
          borderColor: sortedOptions.map(opt => 
            opt.addedBy ? 'rgb(153, 102, 255)' : 'rgb(75, 192, 192)'
          ),
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `${value} ${value === 1 ? 'vote' : 'votes'}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-purple-950 flex flex-col relative overflow-hidden">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-md px-4 pt-16 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-purple-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-purple-100 mb-2">
              Loading Event Data
            </h2>
            <p className="text-purple-200">
              Please wait while we fetch the event details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !eventData) {
    return (
      <div className="min-h-screen bg-purple-950 flex flex-col relative overflow-hidden">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-md px-4 pt-16 text-center">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-purple-100 mb-2">
              Error Loading Event
            </h2>
            <p className="text-red-300 mb-8">
              {error instanceof Error ? error.message : "Failed to load event data"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-950">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Event Header */}
          <div className="bg-purple-900/40 rounded-xl p-6 border border-purple-700/50 mb-6">
            <h1 className="text-3xl font-bold text-purple-100 mb-2">
              {eventData.event.name}
            </h1>
            <p className="text-purple-200 mb-4">
              {eventData.event.description}
            </p>
            <div className="flex items-center text-sm text-purple-300">
              <span className="bg-blue-600/30 text-blue-200 px-2 py-1 rounded">
                {eventData.responses.length} Responses
              </span>
            </div>
          </div>

          {/* Voting Categories Section */}
          <div className="bg-purple-900/40 rounded-xl border border-purple-700/50 mb-6">
            <div className="p-6 border-b border-purple-700/50">
              <h2 className="text-2xl font-semibold text-purple-100">
                Voting Results
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-0">
              {/* Category Tabs */}
              <div className="p-4 border-r border-purple-700/50">
                <h3 className="text-md font-medium text-purple-200 mb-4">Categories</h3>
                <div className="space-y-2">
                  {eventData.chartsData.map((category) => (
                    <button
                      key={category.categoryName}
                      onClick={() => setActiveCategory(category.categoryName)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition ${
                        activeCategory === category.categoryName
                          ? "bg-purple-700/50 text-purple-100"
                          : "hover:bg-purple-800/30 text-purple-300"
                      }`}
                    >
                      {category.categoryName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Display */}
              <div className="p-6 md:col-span-3">
                {activeCategory && (
                  <>
                    <h3 className="text-xl font-medium text-purple-100 mb-4">
                      {activeCategory} Voting Results
                    </h3>
                    <div className="h-80 w-full">
                      {getChartData(activeCategory) && (
                        <Bar 
                          data={getChartData(activeCategory)!} 
                          options={chartOptions} 
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventEdit;