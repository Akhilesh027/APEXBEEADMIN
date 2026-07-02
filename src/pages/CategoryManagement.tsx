import React, { useEffect, useState } from 'react';
import {
  FolderPlus,
  PlusCircle,
  Trash2,
  Settings,
  Plus,
  Layers,
  Edit,
  ImageIcon,
} from 'lucide-react';
import { categoryService } from '../services/categoryService';

type AttributeType = 'text' | 'number' | 'select' | 'boolean';

interface CategoryAttribute {
  _id?: string;
  id?: string;
  name: string;
  type: AttributeType;
  required: boolean;
  isVariant: boolean;
  options?: string[];
}

interface Category {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  banner?: string;
  parentId?: any;
  level: 1 | 2 | 3;
  isActive: boolean;
  sortOrder: number;
  brands: string[];
  attributes: CategoryAttribute[];
  children?: Category[];
}

export const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tree, setTree] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newCatName, setNewCatName] = useState('');
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');
  const [newBrands, setNewBrands] = useState('');
  const [newAttributesText, setNewAttributesText] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [showAddCatModal, setShowAddCatModal] = useState(false);

  const [attrName, setAttrName] = useState('');
  const [attrType, setAttrType] = useState<AttributeType>('text');
  const [attrRequired, setAttrRequired] = useState(false);
  const [attrIsVariant, setAttrIsVariant] = useState(false);
  const [attrOptions, setAttrOptions] = useState('');

  const [sandboxColors, setSandboxColors] = useState('Red, Blue, Black');
  const [sandboxSizes, setSandboxSizes] = useState('S, M, L');
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const [all, treeData] = await Promise.all([
        categoryService.getAll(),
        categoryService.getTree(),
      ]);

      setCategories(all);
      setTree(treeData);

      if (!selectedCat && all.length > 0) {
        setSelectedCat(all[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetCategoryForm = () => {
    setNewCatName('');
    setParentId('');
    setDescription('');
    setNewBrands('');
    setNewAttributesText('');
    setSortOrder(0);
    setIsActive(true);
    setImage(null);
    setBanner(null);
    setEditingCat(null);
    setShowAddCatModal(false);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setNewCatName(cat.name);
    setParentId(typeof cat.parentId === 'string' ? cat.parentId : cat.parentId?._id || '');
    setDescription(cat.description || '');
    setNewBrands(cat.brands?.join(', ') || '');
    setNewAttributesText('');
    setSortOrder(cat.sortOrder || 0);
    setIsActive(cat.isActive);
    setImage(null);
    setBanner(null);
    setShowAddCatModal(true);
  };

  const buildInitialAttributes = (): CategoryAttribute[] => {
    if (editingCat) return editingCat.attributes || [];

    return newAttributesText
      .split(',')
      .map((attr) => attr.trim())
      .filter(Boolean)
      .map((name) => {
        const lowerName = name.toLowerCase();
        const isColor = lowerName === 'color';
        const isSize = lowerName === 'size';
        const isVariant = isColor || isSize;

        return {
          name,
          type: isVariant ? 'select' : 'text',
          required: isVariant,
          isVariant,
          options: isColor
            ? ['Red', 'Blue', 'Black', 'Green', 'White']
            : isSize
              ? ['S', 'M', 'L', 'XL', 'XXL']
              : undefined,
        };
      });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCatName.trim()) return;

    try {
      setIsSaving(true);
      const fd = new FormData();

      fd.append('name', newCatName.trim());
      fd.append('description', description);
      fd.append('parentId', parentId);
      fd.append('brands', JSON.stringify(newBrands.split(',').map((b) => b.trim()).filter(Boolean)));
      fd.append('attributes', JSON.stringify(buildInitialAttributes()));
      fd.append('sortOrder', String(sortOrder));
      fd.append('isActive', String(isActive));

      if (image) fd.append('image', image);
      if (banner) fd.append('banner', banner);

      const saved = editingCat
        ? await categoryService.update(editingCat._id, fd)
        : await categoryService.create(fd);

      setSelectedCat(saved);
      await fetchCategories();
      resetCategoryForm();
    } catch (err) {
      console.error(err);
      alert('Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSelectedCategory = async (updatedCategory: Category) => {
    const fd = new FormData();

    fd.append('name', updatedCategory.name);
    fd.append('description', updatedCategory.description || '');
    fd.append(
      'parentId',
      typeof updatedCategory.parentId === 'string'
        ? updatedCategory.parentId
        : updatedCategory.parentId?._id || ''
    );
    fd.append('brands', JSON.stringify(updatedCategory.brands || []));
    fd.append('attributes', JSON.stringify(updatedCategory.attributes || []));
    fd.append('sortOrder', String(updatedCategory.sortOrder || 0));
    fd.append('isActive', String(updatedCategory.isActive));

    const saved = await categoryService.update(updatedCategory._id, fd);

    setSelectedCat(saved);
    await fetchCategories();
  };

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCat || !attrName.trim()) return;

    const newAttribute: CategoryAttribute = {
      name: attrName.trim(),
      type: attrType,
      required: attrRequired,
      isVariant: attrIsVariant,
      options:
        attrType === 'select'
          ? attrOptions.split(',').map((o) => o.trim()).filter(Boolean)
          : undefined,
    };

    const updatedCategory: Category = {
      ...selectedCat,
      attributes: [...(selectedCat.attributes || []), newAttribute],
    };

    await updateSelectedCategory(updatedCategory);

    setAttrName('');
    setAttrType('text');
    setAttrRequired(false);
    setAttrIsVariant(false);
    setAttrOptions('');
  };

  const handleDeleteAttribute = async (attrId: string) => {
    if (!selectedCat) return;

    const updatedCategory: Category = {
      ...selectedCat,
      attributes: selectedCat.attributes.filter(
        (attr) => (attr._id || attr.id) !== attrId
      ),
    };

    await updateSelectedCategory(updatedCategory);
  };

  const handleDeleteCategory = async (cat: Category) => {
    const ok = window.confirm(`Delete ${cat.name}?`);

    if (!ok) return;

    await categoryService.delete(cat._id);
    setSelectedCat(null);
    await fetchCategories();
  };

  const generateSandboxVariants = () => {
    const colors = sandboxColors.split(',').map((c) => c.trim()).filter(Boolean);
    const sizes = sandboxSizes.split(',').map((s) => s.trim()).filter(Boolean);
    const result = [];

    for (const color of colors) {
      for (const size of sizes) {
        result.push({
          sku: `SKU-${color.toUpperCase().substring(0, 3)}-${size.toUpperCase()}`,
          name: `${selectedCat?.name || 'Product'} (${color}, ${size})`,
          color,
          size,
          price: 599,
          stock: 100,
        });
      }
    }

    setGeneratedVariants(result);
  };

  const renderTree = (items: Category[], depth = 0) => {
    return items.map((cat) => (
      <div key={cat._id}>
        <div
          onClick={() => setSelectedCat(cat)}
          className={`p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-all ${selectedCat?._id === cat._id ? 'bg-secondary/40 border-l-4 border-primary' : ''
            }`}
          style={{ paddingLeft: `${16 + depth * 18}px` }}
        >
          <div className="flex items-center gap-3">
            {cat.image ? (
              <img
                src={cat.image}
                alt={cat.name}
                className="w-9 h-9 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                <ImageIcon size={15} className="text-muted-foreground" />
              </div>
            )}

            <div>
              <span className="font-semibold text-xs text-foreground block">
                {cat.name}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Level {cat.level} • {cat.children?.length || 0} Child • {cat.attributes?.length || 0} Attributes
              </span>
            </div>
          </div>

          <Settings size={14} className="text-muted-foreground hover:text-foreground" />
        </div>

        {cat.children && cat.children.length > 0 && renderTree(cat.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card border border-border/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Layers className="text-primary shrink-0" size={24} />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Categories & Attribute Registry
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Manage category tree, banners, images, attributes and product variants
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddCatModal(true)}
          className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl flex items-center gap-1 transition-all select-none"
        >
          <FolderPlus size={14} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 bg-secondary/10">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Product Category Tree
            </h3>
          </div>

          <div className="divide-y divide-border/60">
            {loading ? (
              <div className="p-6 text-xs text-muted-foreground">Loading categories...</div>
            ) : tree.length > 0 ? (
              renderTree(tree)
            ) : (
              <div className="p-6 text-xs text-muted-foreground">
                No categories found. Add your first category.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedCat ? (
            <>
              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {selectedCat.name} Structure
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedCat.slug} • Level {selectedCat.level}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditCategory(selectedCat)}
                      className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80"
                    >
                      <Edit size={14} />
                    </button>

                    <button
                      onClick={() => handleDeleteCategory(selectedCat)}
                      className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {selectedCat.banner && (
                  <img
                    src={selectedCat.banner}
                    alt={selectedCat.name}
                    className="w-full h-36 rounded-xl object-cover border border-border"
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Brands
                    </span>

                    <div className="flex flex-wrap gap-1.5">
                      {selectedCat.brands?.map((brand) => (
                        <span
                          key={brand}
                          className="px-2 py-0.5 bg-secondary text-foreground text-[10px] rounded-lg border border-border/50"
                        >
                          {brand}
                        </span>
                      ))}

                      {(!selectedCat.brands || selectedCat.brands.length === 0) && (
                        <span className="text-xs text-muted-foreground">
                          No brands registered
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Status
                    </span>

                    <span
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${selectedCat.isActive
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-rose-500/10 text-rose-500'
                        }`}
                    >
                      {selectedCat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Dynamic Category Attributes
                </h3>

                <div className="overflow-x-auto border border-border rounded-xl">
                  <table className="w-full border-collapse text-left text-xs text-foreground">
                    <thead className="bg-secondary/40 select-none">
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Attribute Name</th>
                        <th className="p-3 font-semibold text-muted-foreground">Data Type</th>
                        <th className="p-3 font-semibold text-muted-foreground">Required</th>
                        <th className="p-3 font-semibold text-muted-foreground">Variant Rule</th>
                        <th className="p-3 font-semibold text-muted-foreground">Options</th>
                        <th className="p-3 font-semibold text-muted-foreground text-center">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                      {selectedCat.attributes?.map((attr) => (
                        <tr key={attr._id || attr.id} className="hover:bg-secondary/10">
                          <td className="p-3 font-semibold">{attr.name}</td>
                          <td className="p-3 capitalize font-mono text-[10px] text-primary">
                            {attr.type}
                          </td>
                          <td className="p-3">
                            {attr.required ? (
                              <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 font-bold rounded text-[9px]">
                                Required
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[9px]">
                                Optional
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {attr.isVariant ? (
                              <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 font-bold rounded text-[9px]">
                                Variant Rule
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">-</span>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground text-[10px] max-w-xs truncate">
                            {attr.options?.length ? attr.options.join(', ') : 'Free Input'}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteAttribute((attr._id || attr.id)!)}
                              className="p-1 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {(!selectedCat.attributes || selectedCat.attributes.length === 0) && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">
                            No custom attributes defined.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <form
                  onSubmit={handleAddAttribute}
                  className="bg-secondary/10 p-4 rounded-xl border border-border/40 space-y-4"
                >
                  <div className="flex items-center gap-1">
                    <PlusCircle size={14} className="text-primary" />
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                      Define New Parameter
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground block">
                        Attribute Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Fit Type, RAM, Display"
                        value={attrName}
                        onChange={(e) => setAttrName(e.target.value)}
                        className="w-full text-xs p-2 border border-border/80 focus:border-primary rounded-lg bg-card text-foreground outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground block">
                        Data Input Type
                      </label>
                      <select
                        value={attrType}
                        onChange={(e) => setAttrType(e.target.value as AttributeType)}
                        className="w-full text-xs p-2 border border-border/80 focus:border-primary rounded-lg bg-card text-foreground outline-none"
                      >
                        <option value="text">Text Box</option>
                        <option value="number">Number Box</option>
                        <option value="select">Dropdown Choice</option>
                        <option value="boolean">Yes / No Checkbox</option>
                      </select>
                    </div>

                    {attrType === 'select' && (
                      <div className="space-y-1 md:col-span-2 lg:col-span-1">
                        <label className="text-[10px] text-muted-foreground block">
                          Dropdown Options
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Red, Blue, Black"
                          value={attrOptions}
                          onChange={(e) => setAttrOptions(e.target.value)}
                          className="w-full text-xs p-2 border border-border/80 focus:border-primary rounded-lg bg-card text-foreground outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-foreground py-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attrRequired}
                        onChange={(e) => setAttrRequired(e.target.checked)}
                      />
                      Is Field Required?
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attrIsVariant}
                        onChange={(e) => setAttrIsVariant(e.target.checked)}
                      />
                      Is Variant Rule?
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-secondary hover:bg-secondary/80 border border-border/80 text-foreground font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
                  >
                    <Plus size={14} /> Add Parameter
                  </button>
                </form>
              </div>

              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="text-indigo-500" size={16} />
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Auto-Variant Matrix Generator
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={sandboxColors}
                    onChange={(e) => setSandboxColors(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none font-mono"
                  />

                  <input
                    type="text"
                    value={sandboxSizes}
                    onChange={(e) => setSandboxSizes(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none font-mono"
                  />
                </div>

                <button
                  onClick={generateSandboxVariants}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Generate Matrix Combinations
                </button>

                {generatedVariants.length > 0 && (
                  <div className="mt-4 border border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full border-collapse text-left text-[11px] text-foreground">
                      <thead className="bg-secondary/40 sticky top-0">
                        <tr>
                          <th className="p-2.5">SKU</th>
                          <th className="p-2.5">Label</th>
                          <th className="p-2.5">Color</th>
                          <th className="p-2.5">Size</th>
                          <th className="p-2.5">Price</th>
                          <th className="p-2.5">Stock</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-border">
                        {generatedVariants.map((variant) => (
                          <tr key={variant.sku}>
                            <td className="p-2.5 font-mono text-indigo-500">{variant.sku}</td>
                            <td className="p-2.5 text-muted-foreground">{variant.name}</td>
                            <td className="p-2.5">{variant.color}</td>
                            <td className="p-2.5">{variant.size}</td>
                            <td className="p-2.5">₹{variant.price}</td>
                            <td className="p-2.5 text-emerald-500">{variant.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-xs text-muted-foreground">
              Select a category from the left panel.
            </div>
          )}
        </div>
      </div>

      {showAddCatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                {editingCat ? 'Edit Category' : 'Add New Product Category'}
              </span>

              <button
                onClick={resetCategoryForm}
                className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <input
                type="text"
                placeholder="Category Name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none"
                required
              />

              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none"
              >
                <option value="">Main Category</option>
                {categories
                  .filter((cat) => cat.level < 3 && cat._id !== editingCat?._id)
                  .map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {'— '.repeat(cat.level - 1)}
                      {cat.name}
                    </option>
                  ))}
              </select>

              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none"
              />

              <input
                type="text"
                placeholder="Brands comma separated"
                value={newBrands}
                onChange={(e) => setNewBrands(e.target.value)}
                className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none"
              />

              {!editingCat && (
                <input
                  type="text"
                  placeholder="Initial attributes comma separated"
                  value={newAttributesText}
                  onChange={(e) => setNewAttributesText(e.target.value)}
                  className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none"
                />
              )}

              <input
                type="number"
                placeholder="Sort Order"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full p-2.5 border border-border/80 focus:border-primary rounded-xl bg-secondary/15 text-foreground outline-none"
              />

              <div>
                <label className="text-muted-foreground block mb-1">Category Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="w-full p-2.5 border border-border/80 rounded-xl bg-secondary/15"
                />
              </div>

              <div>
                <label className="text-muted-foreground block mb-1">Category Banner</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBanner(e.target.files?.[0] || null)}
                  className="w-full p-2.5 border border-border/80 rounded-xl bg-secondary/15"
                />
              </div>

              <label className="flex items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active Category
              </label>

              <button
                type="submit"
                disabled={isSaving}
                className={`w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSaving && (
                  <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSaving ? 'Saving Category...' : (editingCat ? 'Update Category' : 'Register Category')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};