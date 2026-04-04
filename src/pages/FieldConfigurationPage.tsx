import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface FieldConfig {
  id: string;
  label: string;
  enabled: boolean;
  category?: string;
}

interface SubTabData {
  id: string;
  label: string;
  fields: FieldConfig[];
}

interface TabData {
  id: string;
  label: string;
  fields: FieldConfig[];
  subTabs?: SubTabData[];
}

export default function FieldConfigurationPage() {
  // Initialize state with 3 main tabs
  const [tabsData, setTabsData] = useState<TabData[]>([
    {
      id: "overview",
      label: "Overview Tab",
      fields: [
        { id: "reference_number", label: "Reference Number", enabled: true },
        { id: "variant_name", label: "Variant Name", enabled: true },
        { id: "trade_name", label: "Trade Name", enabled: true },
        { id: "emdn_code", label: "EMDN Code", enabled: false },
        { id: "model_reference", label: "Model / Reference", enabled: true },
        { id: "udi_di", label: "UDI-DI", enabled: true },
        { id: "basic_udi_di", label: "Basic UDI-DI", enabled: false },
        { id: "intended_purpose", label: "Intended Purpose", enabled: false },
        { id: "medical_device_type", label: "Medical Device Type", enabled: false },
        { id: "notified_body", label: "Notified Body", enabled: false },
        { id: "design_freeze_date", label: "Design Freeze Date", enabled: true },
        { id: "regulatory_status_by_market", label: "Regulatory Status by Market", enabled: true },
      ],
    },
    {
      id: "purpose",
      label: "Purpose Tab",
      fields: [
        { id: "intended_use", label: "Intended Use (The Why)", enabled: true },
        { id: "intended_function", label: "Intended Function / Indications (The What and for What)", enabled: true },
        { id: "mode_of_action", label: "Mode of Action (The How)", enabled: false },
        { id: "intended_patient_population", label: "Intended Patient Population (On Whom)", enabled: true },
        { id: "intended_user", label: "Intended User (By Whom)", enabled: true },
        { id: "duration_of_use", label: "Duration of Use (How Long)", enabled: true },
        { id: "environment_of_use", label: "Environment of Use (The Where)", enabled: true },
        { id: "contraindications", label: "Contraindications", enabled: true },
        { id: "warnings_precautions", label: "Warnings & Precautions", enabled: true },
        { id: "clinical_benefits", label: "Clinical Benefits - Optional", enabled: false },
        { id: "how_to_use", label: "How to Use", enabled: true },
        { id: "charging", label: "Charging", enabled: true },
        { id: "maintenance", label: "Maintenance", enabled: true },
      ],
    },
    {
      id: "regulatory",
      label: "Regulatory Tab",
      fields: [],
      subTabs: [
        {
          id: "regulatory_information",
          label: "Regulatory Information Tab",
          fields: [
            { id: "regulatory_information", label: "Regulatory Information", enabled: true },
          ],
        },
        {
          id: "ai_classification",
          label: "AI Classification Tab",
          fields: [
            { id: "suggested_class", label: "Suggested Class", enabled: true },
            { id: "reasoning", label: "Reasoning", enabled: true },
            { id: "improve_classification_accuracy", label: "Improve Classification Accuracy", enabled: true },
          ],
        },
        {
          id: "regulatory_dna",
          label: "Regulatory DNA Tab",
          fields: [
            { id: "overall_progress", label: "Overall Progress", enabled: true },
            { id: "critical_fields", label: "Critical Fields", enabled: true },
            { id: "critical_field_status", label: "Critical Field Status", enabled: true },
            { id: "additional_analysis_features", label: "Additional Analysis Features", enabled: true },
          ],
        },
        {
          id: "emdn_code",
          label: "EMDN Code Tab",
          fields: [
            { id: "emdn_classification", label: "EMDN Classification", enabled: true },
            { id: "current_emdn_code", label: "Current EMDN Code", enabled: true },
          ],
        },
        {
          id: "fda_search",
          label: "FDA Search Tab",
          fields: [
            { id: "full_text", label: "Full Text", enabled: true },
            { id: "predicate_trail", label: "Predicate Trail", enabled: true },
            { id: "similar_devices", label: "Similar Devices", enabled: true },
          ],
        },
      ],
    },
  ]);

  const [activeRegulatorySubTab, setActiveRegulatorySubTab] = useState("regulatory_information");

  const handleToggle = (tabId: string, fieldId: string, enabled: boolean, subTabId?: string) => {
    setTabsData((prev) =>
      prev.map((tab) => {
        if (tab.id === tabId) {
          if (subTabId && tab.subTabs) {
            // Handle sub-tab field toggle
            return {
              ...tab,
              subTabs: tab.subTabs.map((subTab) =>
                subTab.id === subTabId
                  ? {
                      ...subTab,
                      fields: subTab.fields.map((field) =>
                        field.id === fieldId ? { ...field, enabled } : field
                      ),
                    }
                  : subTab
              ),
            };
          } else {
            // Handle main tab field toggle
            return {
              ...tab,
              fields: tab.fields.map((field) =>
                field.id === fieldId ? { ...field, enabled } : field
              ),
            };
          }
        }
        return tab;
      })
    );
  };

  const handleSave = () => {
    // Here you would typically save to a backend/database
    console.log("Saving configuration:", tabsData);
    toast.success("Configuration saved successfully!");
  };

  const getEnabledCount = (fields: FieldConfig[]) => {
    return fields.filter((f) => f.enabled).length;
  };

  const getTotalEnabledCount = () => {
    return tabsData.reduce((total, tab) => {
      const mainFieldsCount = getEnabledCount(tab.fields);
      const subTabsCount = tab.subTabs
        ? tab.subTabs.reduce((subTotal, subTab) => subTotal + getEnabledCount(subTab.fields), 0)
        : 0;
      return total + mainFieldsCount + subTabsCount;
    }, 0);
  };

  const getTotalFieldsCount = () => {
    return tabsData.reduce((total, tab) => {
      const mainFieldsCount = tab.fields.length;
      const subTabsCount = tab.subTabs
        ? tab.subTabs.reduce((subTotal, subTab) => subTotal + subTab.fields.length, 0)
        : 0;
      return total + mainFieldsCount + subTabsCount;
    }, 0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Field Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Configure which fields are enabled across all tabs
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Fields</div>
            <div className="text-2xl font-bold">
              {getTotalEnabledCount()} / {getTotalFieldsCount()}
            </div>
          </div>
          <Button onClick={handleSave} size="lg">
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          {tabsData.map((tab) => {
            const mainFieldsCount = getEnabledCount(tab.fields);
            const subTabsCount = tab.subTabs
              ? tab.subTabs.reduce((total, subTab) => total + getEnabledCount(subTab.fields), 0)
              : 0;
            const totalEnabled = mainFieldsCount + subTabsCount;
            const totalFields =
              tab.fields.length +
              (tab.subTabs ? tab.subTabs.reduce((total, subTab) => total + subTab.fields.length, 0) : 0);

            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="text-sm px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="whitespace-nowrap font-medium">{tab.label}</span>
                  {totalFields > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {totalEnabled}/{totalFields}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabsData.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {tab.subTabs ? (
              // Regulatory tab with sub-tabs
              <Tabs
                value={activeRegulatorySubTab}
                onValueChange={setActiveRegulatorySubTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-5 h-auto p-1 mb-4">
                  {tab.subTabs.map((subTab) => (
                    <TabsTrigger
                      key={subTab.id}
                      value={subTab.id}
                      className="text-xs px-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="whitespace-nowrap">{subTab.label}</span>
                        {subTab.fields.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {getEnabledCount(subTab.fields)}/{subTab.fields.length}
                          </Badge>
                        )}
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {tab.subTabs.map((subTab) => (
                  <TabsContent key={subTab.id} value={subTab.id} className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>{subTab.label}</CardTitle>
                        <CardDescription>
                          {subTab.fields.length > 0
                            ? `Configure ${subTab.fields.length} field${subTab.fields.length !== 1 ? "s" : ""} in this tab`
                            : "No fields available in this tab"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {subTab.fields.length > 0 ? (
                          <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {subTab.fields.map((field) => (
                                <div
                                  key={field.id}
                                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex-1 space-y-1">
                                    <Label
                                      htmlFor={`${subTab.id}-${field.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {field.label}
                                    </Label>
                                    {field.label.includes("Optional") && (
                                      <Badge variant="outline" className="text-xs mt-1">
                                        Optional
                                      </Badge>
                                    )}
                                  </div>
                                  <Switch
                                    id={`${subTab.id}-${field.id}`}
                                    checked={field.enabled}
                                    onCheckedChange={(checked) =>
                                      handleToggle(tab.id, field.id, checked, subTab.id)
                                    }
                                    className="ml-4"
                                  />
                                </div>
                              ))}
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {getEnabledCount(subTab.fields)} of {subTab.fields.length} fields enabled
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    subTab.fields.forEach((field) => {
                                      handleToggle(tab.id, field.id, true, subTab.id);
                                    });
                                  }}
                                >
                                  Enable All
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    subTab.fields.forEach((field) => {
                                      handleToggle(tab.id, field.id, false, subTab.id);
                                    });
                                  }}
                                >
                                  Disable All
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No fields available in this tab
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              // Regular tab without sub-tabs
              <Card>
                <CardHeader>
                  <CardTitle>{tab.label}</CardTitle>
                  <CardDescription>
                    {tab.fields.length > 0
                      ? `Configure ${tab.fields.length} field${tab.fields.length !== 1 ? "s" : ""} in this tab`
                      : "No fields available in this tab"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tab.fields.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {tab.fields.map((field) => (
                          <div
                            key={field.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 space-y-1">
                              <Label
                                htmlFor={field.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {field.label}
                              </Label>
                              {field.label.includes("Optional") && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Optional
                                </Badge>
                              )}
                            </div>
                            <Switch
                              id={field.id}
                              checked={field.enabled}
                              onCheckedChange={(checked) =>
                                handleToggle(tab.id, field.id, checked)
                              }
                              className="ml-4"
                            />
                          </div>
                        ))}
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {getEnabledCount(tab.fields)} of {tab.fields.length} fields enabled
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              tab.fields.forEach((field) => {
                                handleToggle(tab.id, field.id, true);
                              });
                            }}
                          >
                            Enable All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              tab.fields.forEach((field) => {
                                handleToggle(tab.id, field.id, false);
                              });
                            }}
                          >
                            Disable All
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No fields available in this tab
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

