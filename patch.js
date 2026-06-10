const fs = require('fs');
let code = fs.readFileSync('src/actions/modules.ts', 'utf8');

code = code.replace(/export async function createBill\([\s\S]*?\): Promise<ActionResult> \{\s*try \{/m, 
  `export async function createBill(data: {
  name: string; amount: number; dueDay: number;
  category?: string; reminderDays?: number; notes?: string;
}): Promise<ActionResult> {
  try {
    if (!data.name || data.amount <= 0 || data.dueDay < 1 || data.dueDay > 31) return { success: false, error: "Data tagihan tidak valid." };`);

code = code.replace(/export async function createSavingGoal\([\s\S]*?\): Promise<ActionResult> \{\s*try \{/m, 
  `export async function createSavingGoal(data: {
  name: string; targetAmount: number; targetDate?: string;
  description?: string; icon?: string; color?: string;
}): Promise<ActionResult> {
  try {
    if (!data.name || data.targetAmount <= 0) return { success: false, error: "Data tabungan tidak valid." };`);

code = code.replace(/export async function addSavingContribution\([\s\S]*?\): Promise<ActionResult> \{\s*try \{/m, 
  `export async function addSavingContribution(
  goalId: string, amount: number, note?: string
): Promise<ActionResult> {
  try {
    if (amount <= 0) return { success: false, error: "Nominal harus lebih dari 0." };`);

code = code.replace(/export async function createInventoryItem\([\s\S]*?\): Promise<ActionResult> \{\s*try \{/m, 
  `export async function createInventoryItem(data: {
  name: string; category?: string; unit?: string;
  currentStock?: number; minStock?: number; location?: string;
}): Promise<ActionResult> {
  try {
    if (!data.name) return { success: false, error: "Nama item wajib diisi." };`);

code = code.replace(/export async function updateInventoryStock\([\s\S]*?\): Promise<ActionResult> \{\s*try \{/m, 
  `export async function updateInventoryStock(
  itemId: string, type: "IN" | "OUT" | "ADJUSTMENT", quantity: number, note?: string
): Promise<ActionResult> {
  try {
    if (quantity < 0) return { success: false, error: "Jumlah tidak valid." };`);

code = code.replace(/export async function createShoppingList\([\s\S]*?\): Promise<ActionResult<\{ id: string \}>> \{\s*try \{/m, 
  `export async function createShoppingList(name: string): Promise<ActionResult<{ id: string }>> {
  try {
    if (!name || name.length > 100) return { success: false, error: "Nama daftar tidak valid." };`);

code = code.replace(/export async function addShoppingItem\([\s\S]*?\): Promise<ActionResult> \{\s*try \{/m, 
  `export async function addShoppingItem(
  listId: string,
  data: { name: string; quantity?: number; unit?: string; priority?: "HIGH"|"MEDIUM"|"LOW"; category?: string; note?: string }
): Promise<ActionResult> {
  try {
    if (!data.name) return { success: false, error: "Nama item wajib diisi." };`);

code = code.replace(/export async function createCalendarEvent\([\s\S]*?\): Promise<ActionResult> \{\s*try \{/m, 
  `export async function createCalendarEvent(data: {
  title: string; description?: string; startDate: string; endDate?: string;
  allDay?: boolean; category?: string; color?: string; reminderMinutes?: number;
}): Promise<ActionResult> {
  try {
    if (!data.title || !data.startDate) return { success: false, error: "Judul dan tanggal mulai wajib diisi." };`);

code = code.replace(/export async function createChild\([\s\S]*?\): Promise<ActionResult> \{\s*try \{/m, 
  `export async function createChild(data: {
  name: string; birthDate: string; gender?: "MALE"|"FEMALE";
  schoolName?: string; grade?: string; notes?: string;
}): Promise<ActionResult> {
  try {
    if (!data.name || !data.birthDate) return { success: false, error: "Nama dan tanggal lahir wajib diisi." };`);

code = code.replace(/export async function addGrowthRecord\([\s\S]*?\): Promise<ActionResult> \{\s*try \{/m, 
  `export async function addGrowthRecord(
  childId: string,
  data: { date: string; height?: number; weight?: number; headCircumference?: number; note?: string }
): Promise<ActionResult> {
  try {
    if (!data.date) return { success: false, error: "Tanggal wajib diisi." };`);

code = code.replace(/export async function addImmunization\([\s\S]*?\): Promise<ActionResult> \{\s*try \{/m, 
  `export async function addImmunization(
  childId: string,
  data: { name: string; date?: string; nextDue?: string; status: "PENDING" | "DONE" | "SKIPPED"; location?: string; note?: string }
): Promise<ActionResult> {
  try {
    if (!data.name) return { success: false, error: "Nama imunisasi wajib diisi." };`);

code = code.replace(/export async function createDocument\([\s\S]*?\): Promise<ActionResult> \{\s*try \{/m, 
  `export async function createDocument(data: {
  name: string; category: string; fileUrl: string;
  fileSize?: number; mimeType?: string; expiryDate?: string; description?: string;
}): Promise<ActionResult> {
  try {
    if (!data.name || !data.category || !data.fileUrl || (!data.fileUrl.startsWith('http') && !data.fileUrl.startsWith('/'))) return { success: false, error: "Data dokumen tidak valid." };`);

code = code.replace(/export async function updateEmergencyFund\([\s\S]*?\): Promise<ActionResult> \{\s*try \{/m, 
  `export async function updateEmergencyFund(data: {
  targetMonths: number;
  currentAmount: number;
}): Promise<ActionResult> {
  try {
    if (data.targetMonths <= 0 || data.currentAmount < 0) return { success: false, error: "Data dana darurat tidak valid." };`);

code = code.replace(/export async function createDebt\([\s\S]*?\): Promise<ActionResult> \{\s*try \{/m, 
  `export async function createDebt(data: {
  creditor: string;
  amount: number;
  dueDate?: string;
  description?: string;
}): Promise<ActionResult> {
  try {
    if (!data.creditor || data.amount <= 0) return { success: false, error: "Data hutang tidak valid." };`);

code = code.replace(/export async function createReceivable\([\s\S]*?\): Promise<ActionResult> \{\s*try \{/m, 
  `export async function createReceivable(data: {
  debtor: string;
  amount: number;
  dueDate?: string;
  description?: string;
}): Promise<ActionResult> {
  try {
    if (!data.debtor || data.amount <= 0) return { success: false, error: "Data piutang tidak valid." };`);

code = code.replace(/export async function saveMealPlanItem\([\s\S]*?\): Promise<ActionResult> \{\s*try \{/m, 
  `export async function saveMealPlanItem(data: {
  weekStart: string;
  date: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  menuName: string;
  recipe?: string;
  notes?: string;
}): Promise<ActionResult> {
  try {
    if (!data.weekStart || !data.date || !data.menuName) return { success: false, error: "Data menu makan tidak valid." };`);

fs.writeFileSync('src/actions/modules.ts', code);
console.log('modules.ts updated successfully');
