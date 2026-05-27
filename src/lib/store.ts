"use client"

import { createClient } from "@/utils/supabase/client"

export async function getCategories() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function addCategory(category: any) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from('categories')
    .insert([{ ...category, user_id: user.id }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteCategory(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Transactions
export async function getTransactions() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .order('transaction_date', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function addTransaction(transaction: any) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Optional: convert quantity and amount to correct types or let Supabase handle it
  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...transaction, user_id: user.id }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteTransaction(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Budgets
export async function getBudgets() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budgets')
    .select('*, categories(name)')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function addBudget(budget: any) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from('budgets')
    .insert([{ ...budget, user_id: user.id }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteBudget(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Split Groups
export async function getSplitGroups() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('split_groups')
    .select('*, split_members(*)')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function addSplitGroup(group: any, members: any[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // 1. Insert Group
  const { data: groupData, error: groupError } = await supabase
    .from('split_groups')
    .insert([{ ...group, user_id: user.id }])
    .select()
    .single()
  
  if (groupError) throw groupError

  // 2. Insert Members
  const membersToInsert = members.map(m => ({
    ...m,
    group_id: groupData.id
  }))

  const { error: membersError } = await supabase
    .from('split_members')
    .insert(membersToInsert)

  if (membersError) throw membersError

  return groupData
}

export async function updateSplitMemberStatus(memberId: string, status: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('split_members')
    .update({ status })
    .eq('id', memberId)
  
  if (error) throw error
}

// User Actions
export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

// Generic get and set for local preferences
function getLocalTable(table: string) {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(`velin_${table}`);
  return data ? JSON.parse(data) : [];
}

function setLocalTable(table: string, data: any[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`velin_${table}`, JSON.stringify(data));
  }
}

// Profiles (Stored locally for preferences)
export function getProfile() {
  const profiles = getLocalTable('profiles');
  if (profiles.length === 0) {
    const defaultProfile = {
      full_name: "User",
      default_currency: "INR",
      theme_preference: "system",
    };
    setLocalTable('profiles', [defaultProfile]);
    return defaultProfile;
  }
  return profiles[0];
}

export function updateProfile(updates: any) {
  const profiles = getLocalTable('profiles');
  if (profiles.length > 0) {
    profiles[0] = { ...profiles[0], ...updates };
    setLocalTable('profiles', profiles);
  }
}
