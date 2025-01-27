import { NavigateFunction } from 'react-router-dom';

// Define initial navigate as a NavigateFunction
export let navigate: NavigateFunction = () => {
  throw new Error('Navigation not initialized');
};

// Type the setNavigate function
export const setNavigate = (fn: NavigateFunction): NavigateFunction => {
  return (navigate = fn);
};