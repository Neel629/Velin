"use client"

// Generate a random UUID
function uuidv4() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generic get and set
function getTable(table: string) {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(`velin_${table}`);
  return data ? JSON.parse(data) : [];
}

function setTable(table: string, data: any[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`velin_${table}`, JSON.stringify(data));
  }
}

// Categories
export function getCategories() {
  const categories = getTable('categories');
  return categories.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function addCategory(category: any) {
  const categories = getTable('categories');
  const newCategory = { ...category, id: uuidv4(), created_at: new Date().toISOString() };
  categories.push(newCategory);
  setTable('categories', categories);
  return newCategory;
}

export function deleteCategory(id: string) {
  const categories = getTable('categories');
  setTable('categories', categories.filter((c: any) => c.id !== id));
}

// Transactions
export function getTransactions() {
  const transactions = getTable('transactions');
  const categories = getTable('categories');
  
  // Join categories manually
  const joined = transactions.map((t: any) => {
    const category = categories.find((c: any) => c.id === t.category_id);
    return { ...t, categories: category ? { name: category.name } : null };
  });
  
  return joined.sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
}

export function addTransaction(transaction: any) {
  const transactions = getTable('transactions');
  const newTransaction = { ...transaction, id: uuidv4(), created_at: new Date().toISOString() };
  transactions.push(newTransaction);
  setTable('transactions', transactions);
  return newTransaction;
}

export function deleteTransaction(id: string) {
  const transactions = getTable('transactions');
  setTable('transactions', transactions.filter((t: any) => t.id !== id));
}

// Budgets
export function getBudgets() {
  const budgets = getTable('budgets');
  const categories = getTable('categories');
  
  // Join categories
  const joined = budgets.map((b: any) => {
    const category = categories.find((c: any) => c.id === b.category_id);
    return { ...b, categories: category ? { name: category.name, color: category.color } : null };
  });
  
  return joined.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function addBudget(budget: any) {
  const budgets = getTable('budgets');
  const newBudget = { ...budget, id: uuidv4(), created_at: new Date().toISOString() };
  budgets.push(newBudget);
  setTable('budgets', budgets);
  return newBudget;
}

export function deleteBudget(id: string) {
  const budgets = getTable('budgets');
  setTable('budgets', budgets.filter((b: any) => b.id !== id));
}

// Split Groups
export function getSplitGroups() {
  const groups = getTable('split_groups');
  const members = getTable('split_members');
  
  const joined = groups.map((g: any) => {
    return {
      ...g,
      split_members: members.filter((m: any) => m.split_group_id === g.id)
    };
  });
  
  return joined.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function addSplitGroup(group: any, members: any[]) {
  const groups = getTable('split_groups');
  const allMembers = getTable('split_members');
  
  const newGroup = { ...group, id: uuidv4(), created_at: new Date().toISOString() };
  groups.push(newGroup);
  
  const newMembers = members.map(m => ({
    ...m,
    id: uuidv4(),
    split_group_id: newGroup.id,
    created_at: new Date().toISOString()
  }));
  
  setTable('split_groups', groups);
  setTable('split_members', [...allMembers, ...newMembers]);
  return newGroup;
}

export function updateSplitMemberStatus(memberId: string, status: string) {
  const members = getTable('split_members');
  const index = members.findIndex((m: any) => m.id === memberId);
  if (index !== -1) {
    members[index].status = status;
    setTable('split_members', members);
  }
}

// Profiles
export function getProfile() {
  const profiles = getTable('profiles');
  if (profiles.length === 0) {
    // Create default profile
    const defaultProfile = {
      id: uuidv4(),
      full_name: "Guest User",
      default_currency: "INR",
      theme_preference: "system",
      updated_at: new Date().toISOString()
    };
    setTable('profiles', [defaultProfile]);
    return defaultProfile;
  }
  return profiles[0];
}

export function updateProfile(updates: any) {
  const profiles = getTable('profiles');
  if (profiles.length > 0) {
    profiles[0] = { ...profiles[0], ...updates, updated_at: new Date().toISOString() };
    setTable('profiles', profiles);
  }
}
