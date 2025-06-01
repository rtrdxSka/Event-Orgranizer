// hooks/usePaginatedSuggestions.ts
import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOtherUserSuggestions } from '@/lib/api';
import { OtherUserResponsesData } from '@/types';

interface PaginatedSuggestionsData extends OtherUserResponsesData {
  hasMore: boolean;
  hasMoreByField?: {
    dates: boolean;
    places: boolean;
    customFields: Record<string, boolean>;
  };
  pagination: {
    page: number;
    limit: number;
    total: number | null;
  };
}

interface UsePaginatedSuggestionsOptions {
  eventId: string;
  enabled?: boolean;
  maxSuggestionsPerField?: number;
  limitPerPage?: number;
}

interface UsePaginatedSuggestionsReturn {
  // Data
  suggestions: OtherUserResponsesData['uniqueSuggestions'];
  event: OtherUserResponsesData['event'];
  
  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  
  // Error states
  isError: boolean;
  error: Error | null;
  
  // Pagination
  hasMore: boolean;
  hasMoreByField: {
    dates: boolean;
    places: boolean;
    customFields: Record<string, boolean>;
  };
  currentPage: number;
  totalLoaded: {
    dates: number;
    places: number;
    customFields: Record<string, number>;
  };
  
  // Actions
  loadMore: () => void;
  reset: () => void;
}

export const usePaginatedSuggestions = ({
  eventId,
  enabled = true,
  maxSuggestionsPerField = 100,
  limitPerPage = 50
}: UsePaginatedSuggestionsOptions): UsePaginatedSuggestionsReturn => {
  const [currentPage, setCurrentPage] = useState(0);
  const [allSuggestions, setAllSuggestions] = useState<OtherUserResponsesData['uniqueSuggestions']>({
    dates: [],
    places: [],
    customFields: {}
  });
  const [hasMore, setHasMore] = useState(true);
  const [hasMoreByField, setHasMoreByField] = useState({
    dates: true,
    places: true,
    customFields: {} as Record<string, boolean>
  });
  const [totalLoaded, setTotalLoaded] = useState({
    dates: 0,
    places: 0,
    customFields: {} as Record<string, number>
  });

  // Query for the current page
  const { 
    data, 
    isLoading, 
    isError, 
    error,
    isFetching 
  } = useQuery({
    queryKey: ['otherUserSuggestions', eventId, currentPage, maxSuggestionsPerField, limitPerPage],
    queryFn: () => getOtherUserSuggestions(eventId, {
      page: currentPage,
      limit: limitPerPage,
      maxSuggestions: maxSuggestionsPerField
    }),
    enabled: enabled && !!eventId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      const newSuggestions = data.data.uniqueSuggestions;
      const paginationData = data.data as PaginatedSuggestionsData;
      
      if (currentPage === 0) {
        // First page - replace all data
        setAllSuggestions(newSuggestions);
        setTotalLoaded({
          dates: newSuggestions.dates.length,
          places: newSuggestions.places.length,
          customFields: Object.fromEntries(
            Object.entries(newSuggestions.customFields).map(([key, values]) => [key, (values as string[]).length])
          )
        });
      } else {
        // Additional pages - merge with existing data
        setAllSuggestions(prev => {
          const merged = {
            dates: [...prev.dates, ...newSuggestions.dates].slice(0, maxSuggestionsPerField),
            places: [...prev.places, ...newSuggestions.places].slice(0, maxSuggestionsPerField),
            customFields: { ...prev.customFields }
          };
          
          // Merge custom fields
          Object.entries(newSuggestions.customFields).forEach(([fieldId, newValues]) => {
            const existing = prev.customFields[fieldId] || [];
            merged.customFields[fieldId] = [...existing, ...(newValues as string[])].slice(0, maxSuggestionsPerField);
          });
          
          return merged;
        });
        
        setTotalLoaded(prev => ({
          dates: Math.min(prev.dates + newSuggestions.dates.length, maxSuggestionsPerField),
          places: Math.min(prev.places + newSuggestions.places.length, maxSuggestionsPerField),
          customFields: {
            ...prev.customFields,
            ...Object.fromEntries(
              Object.entries(newSuggestions.customFields).map(([fieldId, newValues]) => {
                const existingCount = prev.customFields[fieldId] || 0;
                return [fieldId, Math.min(existingCount + (newValues as string[]).length, maxSuggestionsPerField)];
              })
            )
          }
        }));
      }
      
      // Update hasMore based on backend response
      setHasMore(paginationData.hasMore || false);
      
      // Update hasMoreByField if provided by backend
      if (paginationData.hasMoreByField) {
        setHasMoreByField(prevHasMoreByField => ({
          dates: paginationData.hasMoreByField!.dates,
          places: paginationData.hasMoreByField!.places,
          customFields: {
            ...prevHasMoreByField.customFields,
            ...paginationData.hasMoreByField!.customFields
          }
        }));
      } else {
        // Fallback: if no hasMoreByField from backend, derive it from the data
        setHasMoreByField(prevHasMoreByField => ({
          dates: newSuggestions.dates.length > 0 && (paginationData.hasMore || false),
          places: newSuggestions.places.length > 0 && (paginationData.hasMore || false),
          customFields: {
            ...prevHasMoreByField.customFields,
            ...Object.fromEntries(
              Object.entries(newSuggestions.customFields).map(([fieldId, values]) => [
                fieldId, 
                (values as string[]).length > 0 && (paginationData.hasMore || false)
              ])
            )
          }
        }));
      }
    }
  }, [data, currentPage, maxSuggestionsPerField]);

  const loadMore = useCallback(() => {
    if (!isLoading && !isFetching && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [isLoading, isFetching, hasMore]);

  const reset = useCallback(() => {
    setCurrentPage(0);
    setAllSuggestions({
      dates: [],
      places: [],
      customFields: {}
    });
    setTotalLoaded({
      dates: 0,
      places: 0,
      customFields: {}
    });
    setHasMore(true);
    setHasMoreByField({
      dates: true,
      places: true,
      customFields: {}
    });
  }, []);

  return {
    // Data
    suggestions: allSuggestions,
    event: data?.data?.event,
    
    // Loading states
    isLoading: isLoading && currentPage === 0, // Only show loading for first page
    isLoadingMore: isFetching && currentPage > 0,
    
    // Error states
    isError,
    error: error as Error | null,
    
    // Pagination
    hasMore,
    hasMoreByField,
    currentPage,
    totalLoaded,
    
    // Actions
    loadMore,
    reset
  };
};