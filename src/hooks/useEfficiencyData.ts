import { useState, useEffect } from "react";
import { EfficiencyKPIData, EfficiencyFilters } from "@/types/operationalEfficiency";

// Mock data generation
const generateSparklineData = (baseValue: number, variance: number = 10) => {
  return Array.from({ length: 7 }, (_, i) => ({
    period: `Day ${i + 1}`,
    value: Math.round(baseValue + (Math.random() - 0.5) * variance)
  }));
};

const mockEfficiencyData: EfficiencyKPIData = {
  oee: {
    percentage: 78,
    availability: 89,
    performance: 92,
    quality: 95,
    trend: -3.2,
    sparklineData: generateSparklineData(78, 8)
  },
  throughput: {
    units: 1247,
    timeFrame: "Last 30 Days",
    trend: 8.4,
    sparklineData: generateSparklineData(1247, 150)
  },
  cycleTime: {
    hours: 4.2,
    trend: -2.1, // Negative is good (faster)
    sparklineData: generateSparklineData(4.2, 0.5)
  },
  firstPassYield: {
    percentage: 94.2,
    trend: 1.8,
    sparklineData: generateSparklineData(94.2, 3)
  },
  manufacturingCost: {
    cost: 15.72,
    currency: "USD",
    trend: -4.3, // Negative is good (lower cost)
    sparklineData: generateSparklineData(15.72, 2)
  },
  capacityUtilization: {
    percentage: 82,
    trend: 5.6,
    sparklineData: generateSparklineData(82, 8)
  }
};

export function useEfficiencyData(filters: EfficiencyFilters) {
  const [data, setData] = useState<EfficiencyKPIData>(mockEfficiencyData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate data based on filters
      const filteredData = {
        ...mockEfficiencyData,
        // Simulate filter effects
        throughput: {
          ...mockEfficiencyData.throughput,
          timeFrame: filters.dateRange.preset === 'last7days' ? 'Last 7 Days' : 
                     filters.dateRange.preset === 'thisQuarter' ? 'This Quarter' : 
                     'Last 30 Days',
          units: filters.productLine === 'cardiac-devices' ? 892 :
                 filters.productLine === 'orthopedic-implants' ? 1456 :
                 mockEfficiencyData.throughput.units
        },
        oee: {
          ...mockEfficiencyData.oee,
          percentage: filters.facility === 'facility-singapore' ? 85 :
                     filters.facility === 'facility-mexico' ? 72 :
                     mockEfficiencyData.oee.percentage
        }
      };
      
      setData(filteredData);
      setIsLoading(false);
    };

    fetchData();
  }, [filters]);

  return {
    data,
    isLoading,
    error: null
  };
}