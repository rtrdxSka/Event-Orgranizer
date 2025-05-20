import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ListChecks, MessageSquare, Check, UserIcon, List } from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Define types for our component
interface Voter {
  _id: string;
  email: string;
  name?: string;
}

interface Option {
  optionName: string;
  voteCount: number;
  voterDetails: Voter[];
  addedBy?: any | null;
  isOriginal?: boolean;
}

interface Category {
  categoryName: string;
  options: Option[];
}

interface TextFieldResponse {
  userId: string;
  userEmail: string;
  userName?: string;
  response: string;
}

interface TextFieldResponseData {
  fieldId: string;
  categoryName: string;
  responses: TextFieldResponse[];
}

interface ListFieldData {
  fieldId: string;
  categoryName: string;
  fieldType: 'list';
  options: Option[];
}

interface TabInfo {
  id: string;
  label: string;
  type: 'category' | 'list' | 'text';
  fieldId?: string;
}

interface EventVisualizationProps {
  eventData: {
    event: any;
    chartsData: Category[];
    textFieldsData?: TextFieldResponseData[];
    listFieldsData?: ListFieldData[];
  };
  onSelectionChange?: (selections: Record<string, any>) => void;
}

const EventVisualization: React.FC<EventVisualizationProps> = ({ eventData, onSelectionChange }) => {
  // Generate all tabs including categories, list fields, and text fields
  const generateTabs = (): TabInfo[] => {
    const tabs: TabInfo[] = [...eventData.chartsData.map(c => ({ 
      id: `category-${c.categoryName}`, 
      label: c.categoryName, 
      type: 'category' 
    }))];
    
    // Add list fields as additional tabs
    if (eventData.listFieldsData && eventData.listFieldsData.length > 0) {
      eventData.listFieldsData.forEach(field => {
        tabs.push({ 
          id: `list-${field.fieldId}`, 
          label: field.categoryName, 
          type: 'list',
          fieldId: field.fieldId
        });
      });
    }
    
    // Add text fields as additional tabs
    if (eventData.textFieldsData && eventData.textFieldsData.length > 0) {
      eventData.textFieldsData.forEach(field => {
        tabs.push({
          id: `text-${field.fieldId}`,
          label: field.categoryName,
          type: 'text',
          fieldId: field.fieldId
        });
      });
    }
    
    return tabs;
  };

  // Get all the tabs
  const allTabs = generateTabs();

  // Set initial active tab to the first tab if available
  const [activeTab, setActiveTab] = useState<string>(
    allTabs.length > 0 ? allTabs[0].id : ''
  );
  
  // State for dropdown selections that persists across tab changes
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});
  
  // State for list field selections
  const [selectedListItems, setSelectedListItems] = useState<Record<string, string[]>>({});
  
  // State for text field selection
  const [selectedTextResponses, setSelectedTextResponses] = useState<Record<string, string>>({});

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Get active category data
  const getActiveCategoryData = (tabId: string): Category | null => {
    if (!tabId.startsWith('category-')) return null;
    const categoryName = tabId.replace('category-', '');
    return eventData.chartsData.find(c => c.categoryName === categoryName) || null;
  };

  // Get active list field data
  const getActiveListFieldData = (tabId: string): ListFieldData | null => {
    if (!tabId.startsWith('list-')) return null;
    const fieldId = tabId.replace('list-', '');
    return eventData.listFieldsData?.find(f => f.fieldId === fieldId) || null;
  };

  // Get active text field data
  const getActiveTextFieldData = (tabId: string): TextFieldResponseData | null => {
    if (!tabId.startsWith('text-')) return null;
    const fieldId = tabId.replace('text-', '');
    return eventData.textFieldsData?.find(f => f.fieldId === fieldId) || null;
  };

  // Check if a category is a checkbox type
  const isCheckboxField = (categoryName: string): boolean => {
    if (eventData.event.customFields) {
      for (const [key, field] of Object.entries(eventData.event.customFields)) {
        if (field.title === categoryName && field.type === 'checkbox') {
          return true;
        }
      }
    }
    return false;
  };

    const getMaxOptions = (categoryName: string): number => {
    const category = categoryName.toLowerCase();
    
    if (category === 'date' && eventData.event.eventDates) {
      return eventData.event.eventDates.maxVotes || 1;
    }
    
    if (category === 'place' && eventData.event.eventPlaces) {
      return eventData.event.eventPlaces.maxVotes || 1;
    }
    
    // For custom fields, check if there's a specific maxOptions
    if (eventData.event.customFields) {
      for (const [key, field] of Object.entries(eventData.event.customFields)) {
        if (field.title === categoryName) {
          return field.maxOptions || field.maxVotes || 1;
        }
      }
    }
    
    return 1; // Default to 1 if not specified
  };

  // Get max entries for a list field
  const getMaxListEntries = (fieldId: string): number => {
    if (eventData.event.customFields) {
      for (const [key, field] of Object.entries(eventData.event.customFields)) {
        if (key === fieldId && field.type === 'list') {
          return field.maxEntries || 0;
        }
      }
    }
    
    return 0; // Default to unlimited if not specified
  };

  // Distribute options among dropdowns
  const distributeOptions = (options: Option[], categoryName: string): Option[][] => {
    const sortedOptions = [...options].sort((a, b) => b.voteCount - a.voteCount);
    
    // For date, place, and radio fields - use a single dropdown regardless of maxOptions
    if (categoryName.toLowerCase() === 'date' || 
        categoryName.toLowerCase() === 'place' || 
        !isCheckboxField(categoryName)) {
      return [sortedOptions];
    }
    
    // For checkbox fields, use the original multiple dropdown distribution
    const maxOptions = getMaxOptions(categoryName);
    
    // If only one dropdown is needed, return all options in a single array
    if (maxOptions <= 1) {
      return [sortedOptions];
    }
    
    // Initialize arrays for each dropdown
    const distributions: Option[][] = Array(maxOptions).fill(null).map(() => []);
    
    // Distribute options using a round-robin approach
    sortedOptions.forEach((option, index) => {
      const dropdownIndex = index % maxOptions;
      distributions[dropdownIndex].push(option);
    });
    
    return distributions;
  };

  // Get active category, list field, or text field data
  const activeCategory = getActiveCategoryData(activeTab);
  const activeListField = getActiveListFieldData(activeTab);
  const activeTextField = getActiveTextFieldData(activeTab);
  
  // Get distributions for the active tab
  let distributions: Option[][] = [];
  
  if (activeCategory) {
    distributions = distributeOptions(activeCategory.options, activeCategory.categoryName);
  } else if (activeListField) {
    // For list fields, sort by vote count and use a single distribution
    const sortedOptions = [...activeListField.options].sort((a, b) => b.voteCount - a.voteCount);
    distributions = [sortedOptions];
  }

  // Get icon for the tab
  const getTabIcon = (tab: TabInfo) => {
    if (tab.type === 'list') {
      return <List className="w-4 h-4 text-purple-300" />;
    }
    
    if (tab.type === 'text') {
      return <MessageSquare className="w-4 h-4 text-purple-300" />;
    }
    
    const lowerCategory = tab.label.toLowerCase();
    if (lowerCategory === 'date') return <Calendar className="w-4 h-4 text-purple-300" />;
    if (lowerCategory === 'place') return <MapPin className="w-4 h-4 text-purple-300" />;
    return <ListChecks className="w-4 h-4 text-purple-300" />;
  };

  // Handle selection change
  const handleSelectChange = (dropdownIndex: number, value: string) => {
    // Use tabId-dropdownIndex as the key to persist selections across tab changes
    const updatedSelections = {
      ...selectedOptions,
      [`${activeTab}-${dropdownIndex}`]: value
    };
    
    setSelectedOptions(updatedSelections);
    
    // Notify parent component of selection changes if callback provided
    if (onSelectionChange) {
      onSelectionChange({
        categorySelections: updatedSelections,
        listSelections: selectedListItems,
        textSelections: selectedTextResponses
      });
    }
  };
  
  // Handle list item selection
  const handleListItemSelection = (fieldId: string, item: string) => {
    const maxEntries = getMaxListEntries(fieldId);
    const currentSelections = selectedListItems[fieldId] || [];
    let newSelections: string[];
    
    // If item is already selected, remove it
    if (currentSelections.includes(item)) {
      newSelections = currentSelections.filter(i => i !== item);
    } else {
      // If not selected and we haven't reached max, add it
      if (maxEntries === 0 || currentSelections.length < maxEntries) {
        newSelections = [...currentSelections, item];
      } else {
        // If we've reached max, replace the oldest selection (FIFO)
        newSelections = [...currentSelections.slice(1), item];
      }
    }
    
    const updatedListSelections = {
      ...selectedListItems,
      [fieldId]: newSelections
    };
    
    setSelectedListItems(updatedListSelections);
    
    // Notify parent component of selection changes if callback provided
    if (onSelectionChange) {
      onSelectionChange({
        categorySelections: selectedOptions,
        listSelections: updatedListSelections,
        textSelections: selectedTextResponses
      });
    }
  };
  
  // Handle text response selection
  const handleTextResponseSelection = (fieldId: string, userId: string) => {
    const updatedTextSelections = {
      ...selectedTextResponses,
      [fieldId]: userId
    };
    
    setSelectedTextResponses(updatedTextSelections);
    
    // Notify parent component of selection changes if callback provided
    if (onSelectionChange) {
      onSelectionChange({
        categorySelections: selectedOptions,
        listSelections: selectedListItems,
        textSelections: updatedTextSelections
      });
    }
  };

  return (
    <div>
      {/* All Categories, List Fields and Text Fields as Tabs */}
      <Tabs 
        defaultValue={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value);
          // We no longer reset selectedOptions here to allow selections to persist
        }}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6 h-auto">
          {allTabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              className="flex items-center gap-2 data-[state=active]:bg-purple-700 data-[state=active]:text-purple-100 py-2"
            >
              {getTabIcon(tab)}
              <span className="truncate max-w-32">{tab.label}</span>
              {tab.type !== 'category' && (
                <Badge className={`ml-1 h-5 text-xs ${tab.type === 'list' ? 'bg-purple-600/30' : 'bg-blue-600/30'}`}>
                  {tab.type === 'list' ? 'List' : 'Text'}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Content for Category Tabs */}
        {eventData.chartsData.map((category) => (
          <TabsContent key={`category-${category.categoryName}`} value={`category-${category.categoryName}`} className="mt-0">
            <Card className="bg-purple-900/40 border-purple-700/50">
              <CardHeader>
                <CardTitle className="text-xl text-purple-100 flex items-center gap-2">
                  {category.categoryName.toLowerCase() === 'date' ? 
                    <Calendar className="w-5 h-5 text-purple-300" /> : 
                    category.categoryName.toLowerCase() === 'place' ?
                    <MapPin className="w-5 h-5 text-purple-300" /> :
                    <ListChecks className="w-5 h-5 text-purple-300" />
                  }
                  {category.categoryName} Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {distributeOptions(category.options, category.categoryName).map((optionGroup, groupIndex) => (
                    <div key={`group-${groupIndex}`} className="space-y-4">
                      <h3 className="text-lg font-medium text-purple-100 mb-2">
                        {isCheckboxField(category.categoryName) && getMaxOptions(category.categoryName) > 1 ? 
                          `Option ${groupIndex + 1} ${groupIndex === 0 ? "(Top Votes)" : ""}` : 
                          groupIndex === 0 ? "Select an option" : ""}
                      </h3>
                      
                      {optionGroup.length > 0 ? (
                        <>
                          <Select
                            value={selectedOptions[`category-${category.categoryName}-${groupIndex}`]}
                            onValueChange={(value) => handleSelectChange(groupIndex, value)}
                          >
                            <SelectTrigger className="bg-purple-800/50 border-purple-600 text-purple-100">
                              <SelectValue placeholder={`Select ${category.categoryName} option`} />
                            </SelectTrigger>
                            <SelectContent className="bg-purple-900 border-purple-700 text-purple-100 max-h-80">
                              {optionGroup.map((option) => (
                                <SelectItem 
                                  key={option.optionName} 
                                  value={option.optionName}
                                  className="hover:bg-purple-800"
                                >
                                  <div className="flex flex-col">
                                    <div className="flex items-center justify-between w-full">
                                      <span className="truncate max-w-[200px]">
                                        {category.categoryName.toLowerCase() === 'date' 
                                          ? formatDate(option.optionName) 
                                          : option.optionName}
                                      </span>
                                      <Badge className="ml-2 bg-purple-600/50">
                                        {option.voteCount} {option.voteCount === 1 ? 'vote' : 'votes'}
                                      </Badge>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {/* Show top option details */}
                          <div className="mt-2 bg-purple-800/30 rounded-lg p-3">
                            <div className="text-purple-100 font-medium mb-1">
                              Top choice: {category.categoryName.toLowerCase() === 'date' 
                                ? formatDate(optionGroup[0].optionName) 
                                : optionGroup[0].optionName}
                            </div>
                            <div className="text-purple-300 text-sm">
                              {optionGroup[0].voteCount} {optionGroup[0].voteCount === 1 ? 'vote' : 'votes'}
                            </div>
                            
                            {/* Show voters for top option */}
                            {optionGroup[0].voterDetails.length > 0 && (
                              <div className="mt-2">
                                <Accordion type="single" collapsible>
                                  <AccordionItem value="voters" className="border-purple-700/50">
                                    <AccordionTrigger className="text-purple-200 text-xs font-medium py-1">
                                      <div className="flex items-center gap-1">
                                        <UserIcon className="h-3 w-3" />
                                        <span>Show Voters ({optionGroup[0].voterDetails.length})</span>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className="max-h-32 overflow-y-auto">
                                        {optionGroup[0].voterDetails.map((voter, idx) => (
                                          <div key={idx} className="text-purple-300 text-xs py-1 border-t border-purple-700/30 flex items-center">
                                            <div className="w-1 h-1 bg-purple-400 rounded-full mr-2"></div>
                                            {voter.email}
                                          </div>
                                        ))}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            )}
                          </div>
                          
                          {/* Show selected option if it's not the top one */}
                          {selectedOptions[`category-${category.categoryName}-${groupIndex}`] && 
                           selectedOptions[`category-${category.categoryName}-${groupIndex}`] !== optionGroup[0].optionName && (
                            <div className="mt-2 bg-purple-700/30 rounded-lg p-3 border border-purple-600/30">
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-400" />
                                <div className="text-purple-100 font-medium">
                                  Selected: {category.categoryName.toLowerCase() === 'date' 
                                    ? formatDate(selectedOptions[`category-${category.categoryName}-${groupIndex}`]) 
                                    : selectedOptions[`category-${category.categoryName}-${groupIndex}`]}
                                </div>
                              </div>
                              
                              {/* Show voters for selected option */}
                              {optionGroup.find(o => o.optionName === selectedOptions[`category-${category.categoryName}-${groupIndex}`])?.voterDetails.length > 0 && (
                                <div className="mt-2">
                                  <Accordion type="single" collapsible>
                                    <AccordionItem value="selected-voters" className="border-purple-700/50">
                                      <AccordionTrigger className="text-purple-200 text-xs font-medium py-1">
                                        <div className="flex items-center gap-1">
                                          <UserIcon className="h-3 w-3" />
                                          <span>
                                            Show Voters ({optionGroup.find(o => o.optionName === selectedOptions[`category-${category.categoryName}-${groupIndex}`])?.voterDetails.length || 0})
                                          </span>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <div className="max-h-32 overflow-y-auto">
                                          {optionGroup.find(o => o.optionName === selectedOptions[`category-${category.categoryName}-${groupIndex}`])?.voterDetails.map((voter, idx) => (
                                            <div key={idx} className="text-purple-300 text-xs py-1 border-t border-purple-700/30 flex items-center">
                                              <div className="w-1 h-1 bg-purple-400 rounded-full mr-2"></div>
                                              {voter.email}
                                            </div>
                                          ))}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-purple-300 italic">No options available</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* Content for List Field Tabs */}
        {eventData.listFieldsData?.map((field) => (
          <TabsContent key={`list-${field.fieldId}`} value={`list-${field.fieldId}`} className="mt-0">
            <Card className="bg-purple-900/40 border-purple-700/50">
              <CardHeader>
                <CardTitle className="text-xl text-purple-100 flex items-center gap-2">
                  <List className="w-5 h-5 text-purple-300" />
                  {field.categoryName} Responses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Top responses summary */}
                  <div className="bg-purple-800/30 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-medium text-purple-100 mb-3">
                      Top Responses
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {field.options.sort((a, b) => b.voteCount - a.voteCount).slice(0, 6).map((option, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center justify-between p-2 rounded ${
                            idx === 0 ? 'bg-purple-700/40 border border-purple-600/50' : 'bg-purple-800/40'
                          }`}
                        >
                          <div className="truncate pr-2">{option.optionName}</div>
                          <Badge className="bg-purple-600/50 shrink-0">
                            {option.voteCount}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* All responses accordion */}
                  <div>
                    <h3 className="text-lg font-medium text-purple-100 mb-3">
                      All Responses
                    </h3>
                    <div className="text-purple-200 text-sm mb-2">
                      {getMaxListEntries(field.fieldId) > 0 ? 
                        `Select up to ${getMaxListEntries(field.fieldId)} responses` : 
                        "Select responses"}
                      {selectedListItems[field.fieldId]?.length > 0 && 
                        ` (Selected: ${selectedListItems[field.fieldId].length})`}
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      {field.options.sort((a, b) => b.voteCount - a.voteCount).map((option, idx) => {
                        const isSelected = selectedListItems[field.fieldId]?.includes(option.optionName);
                        return (
                        <AccordionItem 
                          key={idx} 
                          value={`option-${idx}`}
                          className={`border-purple-700/50 ${
                            isSelected ? 'bg-purple-600/20 border-purple-500/50' :
                            idx === 0 ? 'bg-purple-700/20 rounded-md' : ''
                          }`}
                        >
                          <AccordionTrigger className="text-purple-100 hover:text-purple-200 hover:no-underline px-3">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent accordion from opening
                                    handleListItemSelection(field.fieldId, option.optionName);
                                  }}
                                  className={`flex items-center justify-center w-5 h-5 rounded mr-2 ${
                                    isSelected ? 'bg-purple-500 text-white' : 'bg-purple-800 hover:bg-purple-700'
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </button>
                                <span className="truncate max-w-md text-left">{option.optionName}</span>
                              </div>
                              <Badge className="ml-2 bg-purple-600/50">
                                {option.voteCount} {option.voteCount === 1 ? 'response' : 'responses'}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pl-4 pt-2 pb-1 space-y-1">
                              {option.voterDetails.length === 0 ? (
                                <p className="text-purple-300 italic">No user details available</p>
                              ) : (
                                option.voterDetails.map((voter, voterIdx) => (
                                  <div key={voterIdx} className="text-purple-300 text-sm py-1 border-t border-purple-700/30 flex items-center">
                                    <div className="w-1 h-1 bg-purple-400 rounded-full mr-2"></div>
                                    {voter.email}
                                  </div>
                                ))
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )})}
                    </Accordion>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* Content for Text Field Tabs */}
        {eventData.textFieldsData?.map((field) => (
          <TabsContent key={`text-${field.fieldId}`} value={`text-${field.fieldId}`} className="mt-0">
            <Card className="bg-purple-900/40 border-purple-700/50">
              <CardHeader>
                <CardTitle className="text-xl text-purple-100 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-300" />
                  {field.categoryName} Responses
                  <Badge className="ml-2 bg-blue-600/30">
                    {field.responses.length} {field.responses.length === 1 ? 'response' : 'responses'}
                  </Badge>
                </CardTitle>
              </CardHeader>
                              <CardContent>
                {field.responses.length === 0 ? (
                  <div className="text-center py-10 bg-purple-800/20 rounded-lg">
                    <p className="text-purple-300 italic">No responses yet</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 pb-2 border-b border-purple-700/30">
                      <h3 className="text-lg font-medium text-purple-100 mb-1">Text Responses</h3>
                      <p className="text-purple-300 text-sm">
                        Select one text response
                        {selectedTextResponses[field.fieldId] && ' (1 selected)'}
                      </p>
                    </div>
                    <div className="space-y-4">
                      {field.responses.map((response, idx) => {
                        const isSelected = selectedTextResponses[field.fieldId] === response.userId;
                        return (
                        <Card 
                          key={idx} 
                          className={`bg-purple-800/40 border-purple-700/50 ${
                            isSelected ? 'border-2 border-purple-500' : 
                            idx === 0 ? 'border-purple-500/50' : ''
                          } cursor-pointer hover:bg-purple-800/60 transition-colors`}
                          onClick={() => handleTextResponseSelection(field.fieldId, response.userId)}
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTextResponseSelection(field.fieldId, response.userId);
                                    }}
                                    className={`flex items-center justify-center w-5 h-5 rounded mr-2 ${
                                      isSelected ? 'bg-purple-500 text-white' : 'bg-purple-800 hover:bg-purple-700'
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3 w-3" />}
                                  </button>
                                  <Badge className="bg-purple-600">{response.userEmail}</Badge>
                                  {response.userName && <span className="text-purple-200 text-sm">({response.userName})</span>}
                                </div>
                                {isSelected && (
                                  <Badge className="bg-green-600/30 text-green-200">Selected</Badge>
                                )}
                              </div>
                              <div className="bg-purple-800/30 p-3 rounded-md border border-purple-700/50">
                                <p className="text-purple-100">{response.response}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default EventVisualization;