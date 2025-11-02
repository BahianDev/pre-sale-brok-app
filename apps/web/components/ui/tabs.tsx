import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = ({ className, ...props }: TabsPrimitive.TabsListProps) => (
  <TabsPrimitive.List
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-slate-900/60 p-1 text-slate-400",
      className
    )}
    {...props}
  />
);

const TabsTrigger = ({ className, ...props }: TabsPrimitive.TabsTriggerProps) => (
  <TabsPrimitive.Trigger
    className={cn(
      "inline-flex min-w-[80px] items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-slate-950 transition-all data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100",
      className
    )}
    {...props}
  />
);

const TabsContent = ({ className, ...props }: TabsPrimitive.TabsContentProps) => (
  <TabsPrimitive.Content
    className={cn("mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", className)}
    {...props}
  />
);

export { Tabs, TabsList, TabsTrigger, TabsContent };
