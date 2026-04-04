import { SunburstNode } from "@/types/charts";

// Example 5-level dataset matching the specification
export const ExamplePortfolioSunburst: SunburstNode = {
  name: "Product Portfolio",
  children: [
    {
      name: "Premium",
      children: [
        {
          name: "SmartRIC",
          children: [
            {
              name: "RIC",
              children: [
                { name: "Rechargeable", children: [ { name: "Right", value: 60 }, { name: "Left", value: 60 } ] },
                { name: "Battery", children: [ { name: "Right", value: 40 }, { name: "Left", value: 40 } ] }
              ]
            },
            {
              name: "BTE",
              children: [
                { name: "Rechargeable", children: [ { name: "Right", value: 40 }, { name: "Left", value: 40 } ] },
                { name: "Battery", children: [ { name: "Right", value: 40 }, { name: "Left", value: 40 } ] }
              ]
            }
          ]
        },
        {
          name: "Allure",
          children: [
            {
              name: "Custom",
              children: [
                { name: "Rechargeable", children: [ { name: "Right", value: 30 }, { name: "Left", value: 30 } ] },
                { name: "Battery", children: [ { name: "Right", value: 20 }, { name: "Left", value: 20 } ] }
              ]
            }
          ]
        }
      ]
    },
    {
      name: "Advanced",
      children: [
        {
          name: "Moment",
          children: [
            {
              name: "RIC",
              children: [
                { name: "Rechargeable", children: [ { name: "Right", value: 45 }, { name: "Left", value: 45 } ] },
                { name: "Battery", children: [ { name: "Right", value: 30 }, { name: "Left", value: 30 } ] }
              ]
            },
            {
              name: "BTE",
              children: [
                { name: "Rechargeable", children: [ { name: "Right", value: 20 }, { name: "Left", value: 20 } ] },
                { name: "Battery", children: [ { name: "Right", value: 20 }, { name: "Left", value: 20 } ] }
              ]
            }
          ]
        },
        {
          name: "Evoke",
          children: [
            {
              name: "Custom",
              children: [
                { name: "Rechargeable", children: [ { name: "Right", value: 20 }, { name: "Left", value: 20 } ] },
                { name: "Battery", children: [ { name: "Right", value: 20 }, { name: "Left", value: 20 } ] }
              ]
            }
          ]
        }
      ]
    },
    {
      name: "Standard",
      children: [
        {
          name: "Classic",
          children: [
            {
              name: "RIC",
              children: [
                { name: "Rechargeable", children: [ { name: "Right", value: 25 }, { name: "Left", value: 25 } ] },
                { name: "Battery", children: [ { name: "Right", value: 25 }, { name: "Left", value: 25 } ] }
              ]
            },
            {
              name: "BTE",
              children: [
                { name: "Rechargeable", children: [ { name: "Right", value: 20 }, { name: "Left", value: 20 } ] },
                { name: "Battery", children: [ { name: "Right", value: 20 }, { name: "Left", value: 20 } ] }
              ]
            }
          ]
        }
      ]
    },
    {
      name: "Basic",
      children: [
        {
          name: "Entry",
          children: [
            {
              name: "RIC",
              children: [
                { name: "Rechargeable", children: [ { name: "Right", value: 15 }, { name: "Left", value: 15 } ] },
                { name: "Battery", children: [ { name: "Right", value: 10 }, { name: "Left", value: 10 } ] }
              ]
            }
          ]
        }
      ]
    }
  ]
};

export function computeTotal(node: SunburstNode): number {
  if (node.value != null) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, c) => sum + computeTotal(c), 0);
}
