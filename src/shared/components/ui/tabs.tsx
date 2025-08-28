import * as React from "react";

export interface TabsProps {
  children?: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

export interface TabsListProps {
  children?: React.ReactNode;
  className?: string;
}

export interface TabsTriggerProps {
  children?: React.ReactNode;
  value: string;
  className?: string;
}

export interface TabsContentProps {
  children?: React.ReactNode;
  value: string;
  className?: string;
}

const TabsContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
}>({
  value: undefined,
  onValueChange: undefined,
});

const Tabs = ({ children, value, onValueChange, defaultValue }: TabsProps) => {
  const [internalValue, setInternalValue] = React.useState(
    defaultValue || value
  );

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [value, onValueChange]
  );

  const currentValue = value !== undefined ? value : internalValue;

  return (
    <TabsContext.Provider
      value={{ value: currentValue, onValueChange: handleValueChange }}
    >
      <div className="w-full">{children}</div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children, className }: TabsListProps) => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${
        className || ""
      }`}
    >
      {children}
    </div>
  );
};

const TabsTrigger = ({ children, value, className }: TabsTriggerProps) => {
  const { value: currentValue, onValueChange } = React.useContext(TabsContext);
  const isActive = currentValue === value;

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "hover:bg-muted/50"
      } ${className || ""}`}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ children, value, className }: TabsContentProps) => {
  const { value: currentValue } = React.useContext(TabsContext);

  if (currentValue !== value) {
    return null;
  }

  return (
    <div
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        className || ""
      }`}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsContent, TabsList, TabsTrigger };
