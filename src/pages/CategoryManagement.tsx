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
  UploadCloud,
  X,
  Image as ImageFileIcon,
  LayoutGrid,
  ListTree,
  Eye,
  Sparkles,
} from 'lucide-react';
import { categoryService } from '../services/categoryService';

type AttributeType = 'text' | 'number' | 'select' | 'boolean';

const ALL_ITEM_TYPES = [
  { key: 'product', label: 'Physical Products' },
  { key: 'restaurant', label: 'Restaurant / Food' },
  { key: 'service', label: 'Services & Bookings' },
  { key: 'course', label: 'Courses & Education' },
  { key: 'event', label: 'Events & Experiences' },
  { key: 'travel', label: 'Travel & Mobility' },
  { key: 'finance', label: 'Financial Services' },
  { key: 'logistics', label: 'Logistics Services' },
];

interface CategoryAttribute {
  _id?: string;
  id?: string;
  name: string;
  type: AttributeType;
  required: boolean;
  isVariant: boolean;
  options?: string[];
  unit?: string;
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
  supportedItemTypes?: string[];
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
  const [imagePreview, setImagePreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [rolloutPhase, setRolloutPhase] = useState<'mvp' | 'phase_2' | 'future'>('mvp');
  const [supportedItemTypes, setSupportedItemTypes] = useState<string[]>(['product']);
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'tree'>('cards');
  const [detailModalCat, setDetailModalCat] = useState<Category | null>(null);

  const [attrName, setAttrName] = useState('');
  const [attrType, setAttrType] = useState<AttributeType>('text');
  const [attrRequired, setAttrRequired] = useState(false);
  const [attrIsVariant, setAttrIsVariant] = useState(false);
  const [attrOptions, setAttrOptions] = useState('');

  const [sandboxColors, setSandboxColors] = useState('Red, Blue, Black');
  const [sandboxSizes, setSandboxSizes] = useState('S, M, L');
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);
  const [resolvedSchema, setResolvedSchema] = useState<any>(null);
  const [modalResolvedSchema, setModalResolvedSchema] = useState<any>(null);

  useEffect(() => {
    const catId = selectedCat?._id || (selectedCat as any)?.id;
    if (catId) {
      categoryService.getResolvedSchema(catId).then((data) => {
        if (data && data.success) {
          setResolvedSchema(data.data);
        } else {
          setResolvedSchema(null);
        }
      });
    } else {
      setResolvedSchema(null);
    }
  }, [selectedCat]);

  useEffect(() => {
    const catId = detailModalCat?._id || (detailModalCat as any)?.id;
    if (catId) {
      categoryService.getResolvedSchema(catId).then((data) => {
        if (data && data.success) {
          setModalResolvedSchema(data.data);
        } else {
          setModalResolvedSchema(null);
        }
      });
    } else {
      setModalResolvedSchema(null);
    }
  }, [detailModalCat]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setBanner(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const toggleSupportedItemType = (key: string) => {
    setSupportedItemTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

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
    setImagePreview('');
    setBannerPreview('');
    setSupportedItemTypes(['product']);
    setEditingCat(null);
    setShowAddCatModal(false);
  };

  const openAddChildCategory = (parent: Category) => {
    resetCategoryForm();
    setParentId(parent._id || parent.id || '');
    setShowAddCatModal(true);
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
    setImagePreview(cat.image || '');
    setBannerPreview(cat.banner || '');
    setSupportedItemTypes(cat.supportedItemTypes && cat.supportedItemTypes.length > 0 ? cat.supportedItemTypes : ['product']);
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
      fd.append('supportedItemTypes', JSON.stringify(supportedItemTypes));
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
    fd.append('supportedItemTypes', JSON.stringify(updatedCategory.supportedItemTypes || ['product']));
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
          className={`p-3.5 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-all ${selectedCat?._id === cat._id ? 'bg-secondary/40 border-l-4 border-primary' : ''
            }`}
          style={{ paddingLeft: `${14 + depth * 16}px` }}
        >
          <div className="flex items-center gap-2.5">
            {cat.image ? (
              <img
                src={cat.image}
                alt={cat.name}
                className="w-8 h-8 rounded-lg object-cover border border-border shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <ImageIcon size={14} className="text-muted-foreground" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-foreground block">
                  {cat.name}
                </span>
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                    cat.level === 1
                      ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                      : cat.level === 2
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}
                >
                  {cat.level === 1 ? 'L1 Main' : cat.level === 2 ? 'L2 Sub' : 'L3 Child'}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                {cat.children?.length || 0} Sub • {cat.attributes?.length || 0} Attrs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {cat.level < 3 && (
              <button
                type="button"
                title="Add Subcategory under this category"
                onClick={(e) => {
                  e.stopPropagation();
                  openAddChildCategory(cat);
                }}
                className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEditCategory(cat);
              }}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit size={13} />
            </button>
          </div>
        </div>

        {cat.children && cat.children.length > 0 && renderTree(cat.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border/80 rounded-2xl p-4 shadow-sm">
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

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                viewMode === 'cards'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid size={13} /> Main Cards View
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                viewMode === 'tree'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListTree size={13} /> Full Tree View
            </button>
          </div>

          <button
            onClick={() => setShowAddCatModal(true)}
            className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl flex items-center gap-1 transition-all select-none shrink-0"
          >
            <FolderPlus size={14} /> Add Category
          </button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Main Categories ({tree.filter((c) => c.level === 1).length})
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Click any category card to open full subcategory details modal
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground bg-card border rounded-2xl">
              Loading category cards...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tree
                .filter((cat) => cat.level === 1)
                .map((cat) => {
                  const subCount = cat.children?.length || 0;
                  const totalChildCount =
                    cat.children?.reduce((acc, sub) => acc + (sub.children?.length || 0), 0) || 0;

                  return (
                    <div
                      key={cat._id}
                      onClick={() => setDetailModalCat(cat)}
                      className="bg-card border border-border/80 hover:border-primary/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-28 bg-gradient-to-r from-slate-900 to-slate-800 overflow-hidden">
                          {cat.banner ? (
                            <img
                              src={cat.banner}
                              alt={cat.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-30">
                              <ImageIcon size={32} className="text-white" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                          <div className="absolute top-3 right-3 flex gap-1.5">
                            <span className="px-2 py-0.5 bg-black/60 backdrop-blur-sm text-emerald-400 text-[10px] font-extrabold rounded-md border border-emerald-500/30">
                              Level 1 Main
                            </span>
                          </div>

                          <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
                            {cat.image ? (
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-10 h-10 rounded-xl object-cover border-2 border-background shadow-md shrink-0 bg-background"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center border-2 border-background shadow-md shrink-0">
                                {cat.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-white truncate drop-shadow-sm">
                                {cat.name}
                              </h4>
                              <p className="text-[10px] text-slate-300 font-mono truncate">
                                /{cat.slug}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {cat.description || `Main category structure for ${cat.name}`}
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-secondary/40 p-2 rounded-xl border border-border/50">
                              <span className="text-sm font-black text-foreground block">
                                {subCount}
                              </span>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                                Subcategories
                              </span>
                            </div>

                            <div className="bg-secondary/40 p-2 rounded-xl border border-border/50">
                              <span className="text-sm font-black text-primary block">
                                {totalChildCount}
                              </span>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                                Child Items
                              </span>
                            </div>
                          </div>

                          {cat.supportedItemTypes && cat.supportedItemTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {cat.supportedItemTypes.map((t) => (
                                <span
                                  key={t}
                                  className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 font-bold text-[9px] rounded-md border border-indigo-500/20 capitalize"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-4 py-3 bg-muted/30 border-t border-border/60 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailModalCat(cat);
                          }}
                          className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1"
                        >
                          <Eye size={13} /> View Subcategories Modal
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            title="Edit Main Category"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditCategory(cat);
                            }}
                            className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            type="button"
                            title="Add Subcategory"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddChildCategory(cat);
                            }}
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
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
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Category Specs & Dynamic Parameters
                  </h3>
                  {resolvedSchema && (
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 font-extrabold text-[10px] rounded-lg border border-emerald-500/20 uppercase">
                      Resolved DB Schema v{resolvedSchema.schemaVersion} ({resolvedSchema.productMode})
                    </span>
                  )}
                </div>

                {resolvedSchema && (
                  <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 rounded-xl border border-emerald-500/30 space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-emerald-500 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-foreground block">
                            Direct Category Schema Active ({selectedCat.name})
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            Resolved directly from CategoryProductSchema in database
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[10px] pt-1">
                      <span className="px-2 py-0.5 bg-card border border-border rounded font-medium">
                        📦 Variant Attributes: <b>{resolvedSchema.variantAttributes?.join(', ') || 'None'}</b>
                      </span>
                      {resolvedSchema.inventoryPolicy?.requiresBatch && (
                        <span className="px-2 py-0.5 bg-card border border-border rounded text-amber-600 font-bold">
                          🏷️ Batch Tracking Required
                        </span>
                      )}
                      {resolvedSchema.inventoryPolicy?.requiresExpiry && (
                        <span className="px-2 py-0.5 bg-card border border-border rounded text-rose-600 font-bold">
                          📅 Expiry Date Required
                        </span>
                      )}
                      {resolvedSchema.deliveryPolicy?.fragile && (
                        <span className="px-2 py-0.5 bg-card border border-border rounded text-purple-600 font-bold">
                          🍷 Fragile Handling Active
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto border border-border rounded-xl">
                  <table className="w-full border-collapse text-left text-xs text-foreground">
                    <thead className="bg-secondary/40 select-none">
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Attribute Name</th>
                        <th className="p-3 font-semibold text-muted-foreground">Data Type</th>
                        <th className="p-3 font-semibold text-muted-foreground">Required</th>
                        <th className="p-3 font-semibold text-muted-foreground">Variant Rule</th>
                        <th className="p-3 font-semibold text-muted-foreground">Unit</th>
                        <th className="p-3 font-semibold text-muted-foreground">Options</th>
                        <th className="p-3 font-semibold text-muted-foreground text-center">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                      {((resolvedSchema?.attributes && resolvedSchema.attributes.length > 0
                        ? resolvedSchema.attributes
                        : selectedCat.level === 1
                        ? []
                        : selectedCat.attributes
                      ) || []).map((attr: any) => (
                        <tr key={attr._id || attr.id || attr.key || attr.name} className="hover:bg-secondary/10">
                          <td className="p-3 font-semibold">
                            {attr.name}
                            {attr.key && <span className="text-[10px] text-muted-foreground block font-mono font-normal">key: {attr.key}</span>}
                          </td>
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
                          <td className="p-3 font-mono text-[10px] text-muted-foreground">
                            {attr.unit || '-'}
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

                      {selectedCat.level === 1 && (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-xs text-muted-foreground bg-secondary/10">
                            🏛️ Level 1 Vertical Header ({selectedCat.name}). Product specifications and variant parameters are defined on Level 2 Subcategories & Level 3 Child Categories.
                          </td>
                        </tr>
                      )}

                      {selectedCat.level !== 1 && (!resolvedSchema?.attributes?.length && (!selectedCat.attributes || selectedCat.attributes.length === 0)) && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">
                            No custom specifications or variant parameters defined for this category.
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
    )}

    {/* MODAL: ADD / EDIT CATEGORY WITH IMAGE & BANNER UPLOADING */}
    {showAddCatModal && (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-sm text-foreground">
            {editingCat ? 'Edit Category / Subcategory' : 'Create New Category'}
          </h3>
          <button onClick={resetCategoryForm} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
          <div>
            <label className="text-muted-foreground block mb-1">Category Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Daily Needs, Devotional"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg"
            />
          </div>

          {/* IMAGE & BANNER UPLOAD CONTROLS */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border border-border">
            {/* Category Icon / Image Upload */}
            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium block text-[11px]">
                Category Icon / Image
              </label>
              <div className="flex items-center gap-2">
                {imagePreview ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-background border border-dashed border-border flex items-center justify-center shrink-0 text-muted-foreground">
                    <ImageFileIcon className="w-4 h-4" />
                  </div>
                )}
                <label className="cursor-pointer px-2.5 py-1.5 bg-background border border-input rounded-lg text-[10px] font-medium hover:bg-accent flex items-center gap-1">
                  <UploadCloud className="w-3 h-3 text-indigo-500" /> Choose Icon
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Category Banner Image Upload */}
            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium block text-[11px]">
                Category Banner Image
              </label>
              <div className="flex items-center gap-2">
                {bannerPreview ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0">
                    <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-background border border-dashed border-border flex items-center justify-center shrink-0 text-muted-foreground">
                    <ImageFileIcon className="w-4 h-4" />
                  </div>
                )}
                <label className="cursor-pointer px-2.5 py-1.5 bg-background border border-input rounded-lg text-[10px] font-medium hover:bg-accent flex items-center gap-1">
                  <UploadCloud className="w-3 h-3 text-indigo-500" /> Choose Banner
                  <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground block mb-1">Parent Category</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              >
                <option value="">None (Top-Level Main Category)</option>
                {categories
                  .filter((c) => !c.level || c.level < 3)
                  .filter((c) => !editingCat || (c._id !== editingCat._id && c.id !== editingCat.id))
                  .map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.level === 2 ? `  └─ [L2 Sub] ${c.name}` : `[L1 Main] ${c.name}`}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Rollout Phase</label>
              <select
                value={rolloutPhase}
                onChange={(e) => setRolloutPhase(e.target.value as any)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              >
                <option value="mvp">MVP Priority</option>
                <option value="phase_2">Phase 2</option>
                <option value="future">Future (Special)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-muted-foreground block mb-1">Supported Item Types</label>
            <div className="grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-lg border border-border max-h-36 overflow-y-auto">
              {ALL_ITEM_TYPES.map((t) => (
                <label key={t.key} className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={supportedItemTypes.includes(t.key)}
                    onChange={() => toggleSupportedItemType(t.key)}
                    className="rounded"
                  />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-muted-foreground block mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Category description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg resize-none"
            />
          </div>

          <div>
            <label className="text-muted-foreground block mb-1">Associated Brands (Comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Amul, Dabur, Freedom"
              value={newBrands}
              onChange={(e) => setNewBrands(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground block mb-1">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded"
                />
                <span>Is Active Category</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={resetCategoryForm}
              className="px-4 py-2 bg-muted text-muted-foreground rounded-xl hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingCat ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* MODAL: MAIN CATEGORY FULL TAXONOMY & SUBCATEGORIES DETAILS */}
  {detailModalCat && (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-3xl rounded-3xl border border-border shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
        {/* Modal Banner Header */}
        <div className="relative h-44 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 overflow-hidden">
          {detailModalCat.banner ? (
            <img
              src={detailModalCat.banner}
              alt={detailModalCat.name}
              className="w-full h-full object-cover opacity-75"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <ImageIcon size={48} className="text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-transparent" />

          <button
            onClick={() => setDetailModalCat(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-all shadow-md"
          >
            <X size={18} />
          </button>

          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div className="flex items-center gap-4">
              {detailModalCat.image ? (
                <img
                  src={detailModalCat.image}
                  alt={detailModalCat.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-background shadow-xl bg-background"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center border-2 border-background shadow-xl">
                  {detailModalCat.name.substring(0, 2).toUpperCase()}
                </div>
              )}

              <div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] rounded-md border border-emerald-500/30 uppercase tracking-wider">
                  Level 1 Main Category
                </span>
                <h2 className="text-xl font-extrabold text-white mt-1 drop-shadow-md">
                  {detailModalCat.name}
                </h2>
                <p className="text-xs text-slate-300 font-mono">
                  slug: /{detailModalCat.slug}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const catToEdit = detailModalCat;
                  setDetailModalCat(null);
                  openEditCategory(catToEdit);
                }}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl backdrop-blur-sm flex items-center gap-1 transition-all"
              >
                <Edit size={13} /> Edit Category
              </button>

              <button
                type="button"
                onClick={() => {
                  const catToAddUnder = detailModalCat;
                  setDetailModalCat(null);
                  openAddChildCategory(catToAddUnder);
                }}
                className="px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl flex items-center gap-1 transition-all shadow-md"
              >
                <Plus size={13} /> Add Subcategory
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Item Types Badges */}
          {detailModalCat.supportedItemTypes && detailModalCat.supportedItemTypes.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Supported Business Item Types
              </span>
              <div className="flex flex-wrap gap-2">
                {detailModalCat.supportedItemTypes.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 bg-indigo-500/10 text-indigo-500 font-bold text-xs rounded-lg border border-indigo-500/20 capitalize"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Subcategories & Child Categories Accordion Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                <ListTree size={16} className="text-primary" />
                Subcategories Taxonomy Breakdown ({detailModalCat.children?.length || 0})
              </h3>
              <span className="text-[10px] text-muted-foreground font-semibold">
                Level 2 Subcategories & Level 3 Child Items
              </span>
            </div>

            {(!detailModalCat.children || detailModalCat.children.length === 0) ? (
              <div className="p-8 text-center bg-secondary/20 rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
                No subcategories registered yet under {detailModalCat.name}. Click "Add Subcategory" to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {detailModalCat.children.map((sub) => (
                  <div
                    key={sub._id}
                    className="bg-card border border-border/80 rounded-2xl p-4 space-y-3 hover:border-primary/40 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                          L2
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                            {sub.name}
                            <span className="text-[9px] text-muted-foreground font-mono font-normal">
                              ({sub.slug})
                            </span>
                          </h4>
                          <span className="text-[10px] text-muted-foreground">
                            {sub.children?.length || 0} Child Category Items
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title="Add Child Category under this Subcategory"
                          onClick={() => {
                            setDetailModalCat(null);
                            openAddChildCategory(sub);
                          }}
                          className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all"
                        >
                          <Plus size={11} /> Add Child Item
                        </button>
                        <button
                          type="button"
                          title="Edit Subcategory"
                          onClick={() => {
                            setDetailModalCat(null);
                            openEditCategory(sub);
                          }}
                          className="p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80"
                        >
                          <Edit size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Level 3 Child Category Chips */}
                    {sub.children && sub.children.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {sub.children.map((child) => (
                          <div
                            key={child._id}
                            className="px-2.5 py-1 bg-secondary/50 hover:bg-secondary text-foreground font-medium text-[11px] rounded-xl border border-border/60 flex items-center gap-1.5 transition-all group"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span>{child.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setDetailModalCat(null);
                                openEditCategory(child);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity ml-1"
                            >
                              <Edit size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground italic px-2 py-1">
                        No child categories under {sub.name} yet.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Specs & Resolved Schema inside Category Modal */}
          <div className="space-y-4 border-t border-border pt-4 text-left">
            {modalResolvedSchema && (
              <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 rounded-2xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        Direct Category Schema Active ({detailModalCat.name})
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Resolved directly from CategoryProductSchema in database
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-600 font-extrabold text-[10px] rounded-lg uppercase">
                    Mode: {modalResolvedSchema.productMode} (v{modalResolvedSchema.schemaVersion})
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-[10px] pt-1">
                  <span className="px-2 py-0.5 bg-card border border-border rounded font-medium">
                    📦 Variant Attributes: <b>{modalResolvedSchema.variantAttributes?.join(', ') || 'None'}</b>
                  </span>
                  {modalResolvedSchema.inventoryPolicy?.requiresBatch && (
                    <span className="px-2 py-0.5 bg-card border border-border rounded text-amber-600 font-bold">
                      🏷️ Batch Tracking Required
                    </span>
                  )}
                  {modalResolvedSchema.inventoryPolicy?.requiresExpiry && (
                    <span className="px-2 py-0.5 bg-card border border-border rounded text-rose-600 font-bold">
                      📅 Expiry Date Required
                    </span>
                  )}
                  {modalResolvedSchema.deliveryPolicy?.fragile && (
                    <span className="px-2 py-0.5 bg-card border border-border rounded text-purple-600 font-bold">
                      🍷 Fragile Handling Active
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-foreground uppercase tracking-wider block">
                  Category Specs & Variant Parameters ({((modalResolvedSchema?.attributes && modalResolvedSchema.attributes.length > 0 ? modalResolvedSchema.attributes : detailModalCat.attributes) || []).length})
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Controls Product Creation Form & Variant SKU Matrices
                </span>
              </div>

              {(!modalResolvedSchema?.attributes?.length && (!detailModalCat.attributes || detailModalCat.attributes.length === 0)) ? (
                <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed rounded-xl">
                  No attributes defined yet for {detailModalCat.name}.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {((modalResolvedSchema?.attributes && modalResolvedSchema.attributes.length > 0
                    ? modalResolvedSchema.attributes
                    : detailModalCat.level === 1
                    ? []
                    : detailModalCat.attributes
                  ) || []).map((attr: any) => (
                    <div
                      key={attr._id || attr.name}
                      className="p-3 bg-muted/30 border border-border/80 hover:border-primary/40 rounded-2xl space-y-2 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-xs text-foreground block">
                            {attr.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 bg-primary/10 text-primary font-mono text-[9px] font-bold rounded capitalize">
                              {attr.type}
                            </span>
                            {attr.unit && (
                              <span className="px-1.5 py-0.2 bg-secondary text-muted-foreground font-mono text-[9px] rounded">
                                Unit: {attr.unit}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {attr.isVariant ? (
                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 font-extrabold text-[9px] rounded-md border border-indigo-500/20">
                              Variant Rule
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-secondary text-muted-foreground font-bold text-[9px] rounded-md">
                              Specification
                            </span>
                          )}

                          {attr.required && (
                            <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-500 font-bold text-[8px] rounded">
                              Required
                            </span>
                          )}
                        </div>
                      </div>

                      {attr.options && attr.options.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[9px] font-bold text-muted-foreground block mb-1">
                            Dropdown Options:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {attr.options.map((opt) => (
                              <span
                                key={opt}
                                className="px-2 py-0.5 bg-background text-foreground text-[10px] rounded-md border border-border/60"
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
</div>
);
};

export default CategoryManagement;