import React, { useState } from 'react';
import { SidebarConfig, ModuleConfig, MenuItem, createModuleConfig, createMenuItem, createSidebarConfig } from './SidebarConfig';
import { 
  BarChart3, 
  Package, 
  FileText, 
  Settings, 
  User,
  Plus,
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react';

interface DynamicConfigEditorProps {
  config: SidebarConfig;
  onConfigChange: (config: SidebarConfig) => void;
}

export function DynamicConfigEditor({ config, onConfigChange }: DynamicConfigEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleConfig | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  const addNewModule = () => {
    const newModule = createModuleConfig(
      `module-${Date.now()}`,
      <Settings className="w-6 h-6" />,
      'New Module',
      'A new module',
      [],
      'New Module'
    );
    
    const updatedConfig = {
      ...config,
      modules: [...config.modules, newModule]
    };
    onConfigChange(updatedConfig);
  };

  const updateModule = (moduleId: string, updates: Partial<ModuleConfig>) => {
    const updatedModules = config.modules.map(module => 
      module.id === moduleId ? { ...module, ...updates } : module
    );
    
    onConfigChange({
      ...config,
      modules: updatedModules
    });
  };

  const deleteModule = (moduleId: string) => {
    const updatedModules = config.modules.filter(module => module.id !== moduleId);
    onConfigChange({
      ...config,
      modules: updatedModules
    });
  };

  const addMenuItem = (moduleId: string, parentId?: string) => {
    const newItem = createMenuItem(
      `item-${Date.now()}`,
      'New Item',
      undefined,
      { icon: <FileText className="w-5 h-5" /> }
    );

    const updatedModules = config.modules.map(module => {
      if (module.id === moduleId) {
        if (parentId) {
          // Add to parent's children
          const updateMenuItemChildren = (items: MenuItem[]): MenuItem[] => {
            return items.map(item => {
              if (item.id === parentId) {
                return {
                  ...item,
                  children: [...(item.children || []), newItem]
                };
              }
              if (item.children) {
                return {
                  ...item,
                  children: updateMenuItemChildren(item.children)
                };
              }
              return item;
            });
          };
          
          return {
            ...module,
            menuItems: updateMenuItemChildren(module.menuItems)
          };
        } else {
          // Add to root level
          return {
            ...module,
            menuItems: [...module.menuItems, newItem]
          };
        }
      }
      return module;
    });

    onConfigChange({
      ...config,
      modules: updatedModules
    });
  };

  const updateMenuItem = (moduleId: string, itemId: string, updates: Partial<MenuItem>) => {
    const updatedModules = config.modules.map(module => {
      if (module.id === moduleId) {
        const updateItem = (items: MenuItem[]): MenuItem[] => {
          return items.map(item => {
            if (item.id === itemId) {
              return { ...item, ...updates };
            }
            if (item.children) {
              return {
                ...item,
                children: updateItem(item.children)
              };
            }
            return item;
          });
        };
        
        return {
          ...module,
          menuItems: updateItem(module.menuItems)
        };
      }
      return module;
    });

    onConfigChange({
      ...config,
      modules: updatedModules
    });
  };

  const deleteMenuItem = (moduleId: string, itemId: string) => {
    const updatedModules = config.modules.map(module => {
      if (module.id === moduleId) {
        const removeItem = (items: MenuItem[]): MenuItem[] => {
          return items.filter(item => {
            if (item.id === itemId) return false;
            if (item.children) {
              return {
                ...item,
                children: removeItem(item.children)
              };
            }
            return true;
          });
        };
        
        return {
          ...module,
          menuItems: removeItem(module.menuItems)
        };
      }
      return module;
    });

    onConfigChange({
      ...config,
      modules: updatedModules
    });
  };

  const toggleConfigOption = (option: keyof SidebarConfig) => {
    onConfigChange({
      ...config,
      [option]: !config[option]
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <Settings className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Dynamic Sidebar Configuration</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Global Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Global Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.enableCollapse}
                  onChange={() => toggleConfigOption('enableCollapse')}
                  className="rounded"
                />
                <span>Enable Collapse</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.enableTooltips}
                  onChange={() => toggleConfigOption('enableTooltips')}
                  className="rounded"
                />
                <span>Enable Tooltips</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.enableBadges}
                  onChange={() => toggleConfigOption('enableBadges')}
                  className="rounded"
                />
                <span>Enable Badges</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.enableAnimations}
                  onChange={() => toggleConfigOption('enableAnimations')}
                  className="rounded"
                />
                <span>Enable Animations</span>
              </label>
            </div>
          </div>

          {/* Modules */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Modules</h3>
              <button
                onClick={addNewModule}
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Module</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {config.modules.map((module) => (
                <div key={module.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {module.icon}
                      <div>
                        <h4 className="font-semibold">{module.label}</h4>
                        <p className="text-sm text-gray-600">{module.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingModule(module)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteModule(module.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="ml-8">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Menu Items ({module.menuItems.length})</span>
                      <button
                        onClick={() => addMenuItem(module.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        + Add Item
                      </button>
                    </div>
                    
                    <div className="space-y-1">
                      {module.menuItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            {item.icon}
                            <span className="text-sm">{item.name}</span>
                            {item.children && (
                              <span className="text-xs text-gray-500">({item.children.length} children)</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => addMenuItem(module.id, item.id)}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              + Child
                            </button>
                            <button
                              onClick={() => setEditingMenuItem(item)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteMenuItem(module.id, item.id)}
                              className="p-1 hover:bg-red-100 rounded transition-colors text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end p-4 border-t space-x-3">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
}
