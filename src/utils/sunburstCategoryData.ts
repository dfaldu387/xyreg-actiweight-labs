import { SunburstNode } from "@/types/charts";

// Example Category-based Portfolio Sunburst
// Ring order: 1) Device Category 2) Product Family (Platform) 3) Product Model/Style 4) Product Variation (leaf values)
export const ExampleCategoryPortfolioSunburst: SunburstNode = {
  name: "Product Portfolio",
  children: [
    {
      name: "Hearing Aids",
      children: [
        {
          name: "Alpha Platform",
          children: [
            { name: "Model A", children: [ { name: "Right", value: 32 }, { name: "Left", value: 30 } ] },
            { name: "Model B", children: [ { name: "Right", value: 24 }, { name: "Left", value: 22 } ] }
          ]
        },
        {
          name: "Beta Platform",
          children: [
            { name: "Model C", children: [ { name: "Right", value: 18 }, { name: "Left", value: 17 } ] },
            { name: "Model D", children: [ { name: "Right", value: 15 }, { name: "Left", value: 14 } ] }
          ]
        }
      ]
    },
    {
      name: "Accessories",
      children: [
        {
          name: "Charging",
          children: [
            { name: "Charger Pro", children: [ { name: "EU Plug", value: 12 }, { name: "US Plug", value: 10 } ] },
            { name: "Charger Mini", children: [ { name: "EU Plug", value: 9 }, { name: "US Plug", value: 8 } ] }
          ]
        },
        {
          name: "Remote Controls",
          children: [
            { name: "Remote A", children: [ { name: "Black", value: 7 }, { name: "Silver", value: 6 } ] },
            { name: "Remote B", children: [ { name: "Black", value: 5 }, { name: "Silver", value: 4 } ] }
          ]
        }
      ]
    },
    {
      name: "Tinnitus Solutions",
      children: [
        {
          name: "Relief Platform",
          children: [
            { name: "Style X", children: [ { name: "Program 1", value: 14 }, { name: "Program 2", value: 12 } ] },
            { name: "Style Y", children: [ { name: "Program 1", value: 11 }, { name: "Program 2", value: 9 } ] }
          ]
        }
      ]
    }
  ]
};
