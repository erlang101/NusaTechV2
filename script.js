// Daftarkan PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('PWA Service Worker aktif!', reg.scope))
      .catch(err => console.warn('PWA gagal didaftarkan:', err));
  });
}

// ============================================================
// KONFIGURASI SUPABASE CLIENT (PT NUSATECH DIGITAL INDONESIA)
// ============================================================
const SUPABASE_URL = "https://gpnpdmwihkubkkziadpe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwbnBkbXdpaGt1YmtremlhZHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NDc5MzksImV4cCI6MjEwNTQyMzkzOX0.pManmCcU3QWvzbmF12yDcADPIr1q5ZL8lxA6trX9Rcg";

let supabaseClient = null;
try {
  if (typeof supabase !== "undefined") {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (err) {
  console.warn("Inisialisasi Supabase gagal:", err);
}

// KUNCI PENYIMPANAN LOKAL
const KEY_HAS_ONBOARDED       = "inventaris_has_onboarded";
const KEY_SESSION_USER        = "inventaris_session_user";
const KEY_REMEMBERED_ACCOUNTS = "inventaris_remembered_accounts";
const KEY_THEME               = "inventaris_theme_mode";
const KEY_LANGUAGE            = "inventaris_language";

const KEY_LOCAL_ITEMS         = "inventaris_local_items";
const KEY_LOCAL_MUTATIONS     = "inventaris_local_mutations";
const KEY_LOCAL_SERVICES      = "inventaris_local_services";
const KEY_PENDING_QUEUE       = "inventaris_pending_sync_queue";

const KEY_GUEST_ITEMS         = "inventaris_guest_items";
const KEY_GUEST_MUTATIONS     = "inventaris_guest_mutations";
const KEY_GUEST_SERVICES      = "inventaris_guest_services";

let inMemoryItems = [];
let inMemoryMutations = [];
let inMemoryServices = [];
let selectedItemIds = new Set(); // State untuk fitur aksi massal

// ============================================================
// HELPER KEAMANAN: SANITASI XSS
// ============================================================
function escapeHtml(str) {
  if (typeof str !== "string") return str ?? "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// KAMUS BILINGUAL (ID / EN)
// ============================================================
const i18nDictionary = {
  id: {
    skip: "Lewati",
    next: "Lanjut",
    login: "Masuk",
    register: "Daftar",
    or: "atau",
    guestMode: "Mode Tamu",
    gateTitle: "NusaTech",
    gateSubtitle: "Sistem Manajemen Aset & Inventaris Terpadu",
    scanTitle: "Pindai QR / Barcode",
    scanInstruction: "Posisikan kode QR barang di dalam kotak",
    navDashboard: "Dashboard",
    navAssets: "Data Aset",
    navMutation: "Mutasi",
    navService: "Maintenance",
    navSettings: "Pengaturan",
    logout: "Keluar",
    welcome: "Selamat Datang,",
    totalValueSub: "Estimasi Nilai Keseluruhan",
    metricUnits: "Total Unit",
    metricTypes: "Jenis Barang",
    metricRooms: "Ruangan",
    quickMenu: "Menu Cepat",
    qaScan: "Scan QR",
    qaAdd: "Tambah Aset",
    qaMutate: "Mutasi",
    qaReport: "Laporan",
    recentActivity: "Aktivitas Terakhir",
    fieldCondition: "Kondisi Aset Lapangan",
    statusGood: "Siap Pakai (Baik)",
    statusMinor: "Rusak Ringan",
    statusMajor: "Rusak Berat",
    roomSpread: "Sebaran Ruangan",
    viewAll: "Buka Semua Aset",
    assetsTitle: "Data Inventaris",
    assetsDesc: "Kelola seluruh aset, informasi spesifikasi, dan stiker QR",
    export: "Ekspor",
    import: "Impor",
    batchQr: "Cetak Semua QR",
    addAsset: "Tambah Aset Baru",
    chipAll: "Semua",
    chipGood: "Baik",
    chipMinor: "Rusak Ringan",
    chipMajor: "Rusak Berat",
    chipAllStatus: "Semua Status",
    mutationTitle: "Mutasi Barang",
    mutationDesc: "Lacak perpindahan aset fisik antar-ruangan",
    recordMutation: "Catat Mutasi",
    serviceTitle: "Maintenance & Servis",
    serviceDesc: "Pantau proses pengerjaan dan biaya perbaikan aset",
    recordService: "Catat Servis",
    settingsTitle: "Pengaturan & Profil",
    settingsDesc: "Kustomisasi identitas, tampilan sistem, bahasa, dan data",
    groupDisplay: "Tampilan Antarmuka",
    themeMode: "Tema Aplikasi",
    themeDesc: "Pilih mode tampilan gelap, terang, atau otomatis",
    themeLight: "Terang",
    themeDark: "Gelap",
    appLanguage: "Bahasa Sistem",
    langDesc: "Pilih bahasa pengantar antarmuka aplikasi",
    groupData: "Manajemen Database",
    backupTitle: "Cadangkan Data (JSON)",
    backupDesc: "Unduh seluruh aset, mutasi, & servis ke file JSON",
    backupBtn: "Cadangkan",
    restoreTitle: "Pulihkan Data (JSON)",
    restoreDesc: "Unggah file cadangan untuk memulihkan database",
    restoreBtn: "Pulihkan",
    resetSimTitle: "Muat Ulang Data Simulasi",
    resetSimDesc: "Kembalikan ke data awal bawaan NusaTech",
    resetData: "Reset Data",
    groupSession: "Sesi & Akun",
    switchAccount: "Ganti Akun Staf",
    switchAccountDesc: "Masuk menggunakan profil pengguna lain",
    switchBtn: "Ganti",
    logoutTitle: "Keluar dari Aplikasi",
    logoutDesc: "Akhiri sesi aktif di perangkat ini",
    searchAssetsPh: "Cari nama barang, kode, ruangan...",
    searchMutationsPh: "Cari log perpindahan barang...",
    searchServicesPh: "Cari data perbaikan teknisi...",
    cardBtnEdit: "Edit",
    cardBtnDelete: "Hapus",
    costLabel: "Biaya",
    changeStatusBtn: "Ubah Status",
    statusQueue: "Dalam Antrean",
    statusProgress: "Sedang Dikerjakan",
    statusDone: "Selesai & Siap Pakai",
    statusProgressShort: "Dikerjakan",
    statusDoneShort: "Selesai",
    statusQueueDesc: "Menunggu pengecekan teknisi",
    statusProgressDesc: "Aset sedang dalam proses perbaikan fisik",
    statusDoneDesc: "Perbaikan tuntas, kondisi barang otomatis pulih \"Baik\"",
    thPhoto: "Foto",
    thName: "Nama Barang",
    thCode: "Kode Aset",
    thCategory: "Kategori",
    thRoom: "Ruangan",
    thStock: "Stok Unit",
    thCondition: "Kondisi Fisik",
    thAction: "Aksi",
    addItemModalTitle: "Tambah Aset Baru",
    addItemModalDesc: "Lengkapi informasi dan foto fisik inventaris",
    itemPhoto: "Foto Barang",
    takePhoto: "Ambil Foto",
    fromGallery: "Dari Galeri",
    removePhoto: "Hapus Foto",
    formItemName: "Nama Barang / Perangkat *",
    formItemCode: "Kode Aset *",
    formItemCategory: "Kategori *",
    formItemRoom: "Ruangan / Lokasi *",
    formItemCondition: "Kondisi Fisik *",
    formItemQty: "Jumlah Unit *",
    formItemUnit: "Satuan *",
    formItemAdvanced: "Informasi Tambahan (Opsional)",
    formItemPrice: "Estimasi Harga Beli / Unit (Rp)",
    formItemSupplier: "Nama Toko / Vendor / Asal Dana",
    formItemNotes: "Catatan Spesifikasi / Keterangan",
    formPurchaseDate: "Tanggal Pembelian",
    formUsefulLife: "Masa Pakai (Tahun)",
    lifeOption4: "4 Tahun (Perangkat IT/Elektronik)",
    lifeOption8: "8 Tahun (Furniture & Kantor)",
    lifeOption5: "5 Tahun (Umum)",
    lifeOption10: "10 Tahun (Mesin/Kendaraan)",
    formNextService: "Jadwal Servis Berikutnya (Opsional)",
    cancel: "Batal",
    saveAsset: "Simpan Aset",
    mutateModalTitle: "Pindahkan Aset (Mutasi)",
    mutateModalDesc: "Pindahkan unit kerja antar-ruangan operasional",
    mutateSelectLabel: "Pilih Aset yang Ingin Dipindah *",
    mutatePlaceholder: "Pilih barang inventaris...",
    sourceRoom: "Ruangan Asal",
    availableStock: "Tersedia",
    transferQty: "Jumlah Dipindahkan *",
    destRoom: "Ruangan Tujuan *",
    transferReason: "Alasan / Keterangan Mutasi",
    processTransfer: "Proses Mutasi",
    serviceModalTitle: "Catat Servis / Perbaikan",
    serviceModalDesc: "Lacak penanganan kendala hardware & suku cadang",
    serviceSelectLabel: "Pilih Aset yang Diservis *",
    servicePlaceholder: "Pilih aset yang rusak...",
    serviceTech: "Nama Teknisi / Vendor *",
    initialStatus: "Status Awal *",
    repairCost: "Estimasi / Biaya Perbaikan (Rp)",
    issueDesc: "Deskripsi Kendala & Komponen Diganti *",
    saveService: "Simpan Servis",
    updateServiceStatus: "Perbarui Status Servis",
    pickAsset: "Pilih Aset",
    pickAssetDesc: "Sentuh barang inventaris yang ingin dipilih",
    exportModalTitle: "Ekspor Dokumen Laporan",
    exportItemsTitle: "Buku Induk Aset",
    exportItemsDesc: "Daftar seluruh barang, nilai finansial, dan sebaran ruang",
    exportMutationsTitle: "Laporan Mutasi Ruangan",
    exportMutationsDesc: "Catatan historis perpindahan unit beserta petugas & waktu",
    exportServicesTitle: "Rekap Servis & Biaya",
    exportServicesDesc: "Daftar perbaikan teknisi, suku cadang, & pengeluaran",
    printPdf: "Cetak / PDF",
    printLabel: "Cetak Label",
    saveImage: "Simpan Gambar",
    deleteItemTitle: "Hapus Data Aset?",
    deleteItemDesc: "Aset",
    deleteItemTail: "akan dihapus dari daftar aktif.",
    confirmDelete: "Ya, Hapus",
    updateProfileTitle: "Perbarui Profil Pengguna",
    updateProfileDesc: "Sesuaikan nama identitas dan peran tim Axentra",
    userNameLabel: "Nama Pengguna / Staf *",
    roleLabel: "Peran / Posisi *",
    save: "Simpan",
    manageAvatarTitle: "Kelola Foto Profil",
    manageAvatarDesc: "Pilih tindakan untuk foto akun Anda",
    cameraSelfieDesc: "Gunakan kamera ponsel untuk jepret langsung",
    galleryDesc: "Gunakan foto yang tersimpan di perangkat",
    deleteAvatar: "Hapus Foto Profil",
    deleteAvatarDesc: "Kembalikan tampilan avatar ke inisial huruf",
    logoutConfirmTitle: "Keluar dari Sesi?",
    logoutConfirmDesc: "Anda harus masuk kembali untuk mengelola aset inventaris.",
    emptyAssetsTitle: "Tidak ada aset ditemukan",
    emptyAssetsDesc: "Cobalah kata kunci lain atau daftarkan aset baru sekarang",
    emptyMutationsTitle: "Belum Ada Riwayat Mutasi",
    emptyMutationsDesc: "Aset yang dipindahkan antar-ruangan akan tercatat otomatis di sini.",
    emptyServicesTitle: "Tidak Ada Catatan Servis",
    emptyServicesDesc: "Aset yang dicatat dalam perbaikan teknisi akan tampil di sini.",
    sortDefault: "⇅ Urutkan: Default",
    sortNameAsc: "Nama (A - Z)",
    sortNameDesc: "Nama (Z - A)",
    sortStockDesc: "Stok Terbanyak",
    sortStockAsc: "Stok Tersedikit",
    sortPriceDesc: "Harga Tertinggi",
    sortPriceAsc: "Harga Terendah",
    depTitle: "Nilai Buku Saat Ini",
    depLoss: "Penyusutan",
    depAgeNoDate: "Data tanggal belum diatur",
    depAgePrefix: "Usia:",
    yearUnit: "thn",
    monthUnit: "bln",
    resetConfirmTitle: "Reset Database Sistem?",
    resetConfirmDesc: "Tindakan ini akan mengembalikan data ke kondisi awal pabrik NusaTech.",
    resetBullet1: "Seluruh data aset kustom akan dihapus.",
    resetBullet2: "Histori mutasi dan catatan servis dikosongkan.",
    resetBullet3: "Log audit aktivitas sistem dibersihkan.",
    resetBullet4: "Akun & sesi login Anda tetap aman.",
    confirmReset: "Ya, Reset Sekarang",
    auditModalTitle: "Riwayat Aktivitas Sistem",
    auditModalDesc: "Catatan kronologis tindakan operasional dan perubahan data aset",
    searchLogsPh: "Cari nama staf, aksi, atau kode aset...",
    viewAllLogs: "Lihat Semua",
    reminderTitle: "Perlu Perawatan Rutin",
    reminderBadge: "Penting",
    reminderDesc: "Ada unit yang jadwal servis berkala sudah tiba atau jatuh tempo dalam minggu ini.",
    signatureLabel: "Tanda Tangan Penerima / Petugas *",
    clearSignature: "Ulangi",
    signatureHint: "Goreskan tanda tangan di sini",
    signatureRequired: "Tanda tangan penerima wajib dibubuhkan!",
    printReceipt: "Cetak Bukti"
  },
  en: {
    skip: "Skip",
    next: "Next",
    login: "Log In",
    register: "Register",
    or: "or",
    guestMode: "Guest Mode (Temporary Exploration)",
    gateTitle: "NusaTech",
    gateSubtitle: "Integrated Asset & Inventory Management System",
    scanTitle: "Scan QR / Barcode",
    scanInstruction: "Align asset QR code within frame",
    navDashboard: "Dashboard",
    navAssets: "Assets",
    navMutation: "Transfer",
    navService: "Service",
    navSettings: "Settings",
    logout: "Log Out",
    welcome: "Welcome,",
    totalValueSub: "Estimated Total Asset Value",
    metricUnits: "Total Units",
    metricTypes: "Categories",
    metricRooms: "Rooms",
    quickMenu: "Quick Actions",
    qaScan: "Scan QR",
    qaAdd: "Add Asset",
    qaMutate: "Transfer",
    qaReport: "Reports",
    recentActivity: "Recent Activity",
    fieldCondition: "Asset Operational Condition",
    statusGood: "Ready (Good)",
    statusMinor: "Minor Damage",
    statusMajor: "Critical Damage",
    roomSpread: "Room Distribution",
    viewAll: "View All Assets",
    assetsTitle: "Asset Inventory",
    assetsDesc: "Manage equipment inventory, specs, and printable QR tags",
    export: "Export",
    import: "Import",
    batchQr: "Print All QR",
    addAsset: "Add New Asset",
    chipAll: "All",
    chipGood: "Good",
    chipMinor: "Minor Damage",
    chipMajor: "Critical Damage",
    chipAllStatus: "All Status",
    mutationTitle: "Asset Transfer Logs",
    mutationDesc: "Track physical item transfers across company rooms",
    recordMutation: "New Transfer",
    serviceTitle: "Maintenance & Repairs",
    serviceDesc: "Monitor technician repairs, part changes, and costs",
    recordService: "Log Service",
    settingsTitle: "Settings & Profile",
    settingsDesc: "Customize team profile, display mode, language, and backups",
    groupDisplay: "User Interface Display",
    themeMode: "Display Mode",
    themeDesc: "Choose light, dark, or system auto appearance",
    themeLight: "Light",
    themeDark: "Dark",
    appLanguage: "System Language",
    langDesc: "Select application interface language",
    groupData: "Database Management",
    backupTitle: "Backup Database (JSON)",
    backupDesc: "Download all items, transfers, & repairs as JSON",
    backupBtn: "Backup",
    restoreTitle: "Restore Database (JSON)",
    restoreDesc: "Upload backup file to restore complete database",
    restoreBtn: "Restore",
    resetSimTitle: "Reset Simulation Data",
    resetSimDesc: "Restore NusaTech initial default sample data",
    resetData: "Reset",
    groupSession: "Session & Access",
    switchAccount: "Switch Account",
    switchAccountDesc: "Sign in with a different staff profile",
    switchBtn: "Switch",
    logoutTitle: "Sign Out",
    logoutDesc: "End current active session on this device",
    searchAssetsPh: "Search item name, code, room...",
    searchMutationsPh: "Search item transfer records...",
    searchServicesPh: "Search technician repair logs...",
    cardBtnEdit: "Edit",
    cardBtnDelete: "Delete",
    costLabel: "Cost",
    changeStatusBtn: "Change Status",
    statusQueue: "In Queue",
    statusProgress: "In Progress",
    statusDone: "Completed & Ready",
    statusProgressShort: "In Progress",
    statusDoneShort: "Completed",
    statusQueueDesc: "Awaiting inspection",
    statusProgressDesc: "Physical repair is currently ongoing",
    statusDoneDesc: "Repair completed, asset condition automatically restored to \"Good\"",
    thPhoto: "Photo",
    thName: "Item Name",
    thCode: "Asset Code",
    thCategory: "Category",
    thRoom: "Location",
    thStock: "Quantity",
    thCondition: "Condition",
    thAction: "Action",
    addItemModalTitle: "Add New Asset",
    addItemModalDesc: "Fill in asset details and capture physical photo",
    itemPhoto: "Item Photo",
    takePhoto: "Take Photo",
    fromGallery: "From Gallery",
    removePhoto: "Remove Photo",
    formItemName: "Item / Hardware Name *",
    formItemCode: "Asset Code *",
    formItemCategory: "Category *",
    formItemRoom: "Room / Location *",
    formItemCondition: "Condition *",
    formItemQty: "Quantity *",
    formItemUnit: "Unit *",
    formItemAdvanced: "Additional Information (Optional)",
    formItemPrice: "Purchase Price / Unit (IDR)",
    formItemSupplier: "Vendor / Funding Source",
    formItemNotes: "Technical Specs / Remarks",
    formPurchaseDate: "Purchase Date",
    formUsefulLife: "Useful Life (Years)",
    lifeOption4: "4 Years (IT / Electronic Devices)",
    lifeOption8: "8 Years (Office Furniture)",
    lifeOption5: "5 Years (General)",
    lifeOption10: "10 Years (Machinery / Vehicles)",
    formNextService: "Next Service Schedule (Optional)",
    cancel: "Cancel",
    saveAsset: "Save Asset",
    mutateModalTitle: "Transfer Asset",
    mutateModalDesc: "Relocate units to another operational room",
    mutateSelectLabel: "Select Asset to Move *",
    mutatePlaceholder: "Choose an inventory item...",
    sourceRoom: "Source Room",
    availableStock: "Available",
    transferQty: "Transfer Quantity *",
    destRoom: "Destination Room *",
    transferReason: "Transfer Purpose / Notes",
    processTransfer: "Execute Transfer",
    serviceModalTitle: "Log Maintenance / Repair",
    serviceModalDesc: "Track hardware damage, parts, and costs",
    serviceSelectLabel: "Select Asset to Repair *",
    servicePlaceholder: "Select damaged asset...",
    serviceTech: "Technician / Vendor Name *",
    initialStatus: "Initial Status *",
    repairCost: "Estimated Repair Cost (IDR)",
    issueDesc: "Issue Description & Replaced Parts *",
    saveService: "Save Service Log",
    updateServiceStatus: "Update Repair Status",
    pickAsset: "Select Asset",
    pickAssetDesc: "Tap an inventory item to select",
    exportModalTitle: "Export Report Document",
    exportItemsTitle: "Master Inventory Ledger",
    exportItemsDesc: "Complete asset list, financial valuation, and room layout",
    exportMutationsTitle: "Transfer History Report",
    exportMutationsDesc: "Historical records of item moves with staff and timestamp",
    exportServicesTitle: "Maintenance & Repair Summary",
    exportServicesDesc: "Log of technician repairs, replaced parts, and expenses",
    printPdf: "Print / PDF",
    printLabel: "Print Label",
    saveImage: "Save Image",
    deleteItemTitle: "Delete Asset?",
    deleteItemDesc: "Asset",
    deleteItemTail: "will be removed from active inventory.",
    confirmDelete: "Yes, Delete",
    updateProfileTitle: "Update Profile",
    updateProfileDesc: "Adjust account name and team role",
    userNameLabel: "User / Team Name *",
    roleLabel: "Role / Position *",
    save: "Save",
    manageAvatarTitle: "Manage Profile Photo",
    manageAvatarDesc: "Choose action for your account avatar",
    cameraSelfieDesc: "Use phone camera to snap directly",
    galleryDesc: "Select an image file from storage",
    deleteAvatar: "Remove Avatar",
    deleteAvatarDesc: "Restore avatar to letter initials",
    logoutConfirmTitle: "Sign Out of Session?",
    logoutConfirmDesc: "You will need to sign back in to manage company inventory.",
    emptyAssetsTitle: "No assets found",
    emptyAssetsDesc: "Try a different search term or register a new asset now",
    emptyMutationsTitle: "No Transfer Records Yet",
    emptyMutationsDesc: "Items moved across rooms will be tracked here automatically.",
    emptyServicesTitle: "No Maintenance Records",
    emptyServicesDesc: "Assets logged for technician repairs will appear here.",
    sortDefault: "⇅ Sort: Default",
    sortNameAsc: "Name (A - Z)",
    sortNameDesc: "Name (Z - A)",
    sortStockDesc: "Highest Stock",
    sortStockAsc: "Lowest Stock",
    sortPriceDesc: "Highest Price",
    sortPriceAsc: "Lowest Price",
    depTitle: "Current Book Value",
    depLoss: "Depreciation",
    depAgeNoDate: "Purchase date not set",
    depAgePrefix: "Age:",
    yearUnit: "yrs",
    monthUnit: "mos",
    resetConfirmTitle: "Reset System Database?",
    resetConfirmDesc: "This will restore data to NusaTech factory defaults.",
    resetBullet1: "All custom asset data will be erased.",
    resetBullet2: "Transfer history and repair logs will be cleared.",
    resetBullet3: "System audit logs will be cleaned.",
    resetBullet4: "Your account credentials remain safe.",
    confirmReset: "Yes, Reset Now",
    auditModalTitle: "System Audit Trail",
    auditModalDesc: "Chronological log of operational tasks and asset modifications",
    searchLogsPh: "Search staff name, action, or code...",
    viewAllLogs: "View All",
    reminderTitle: "Routine Service Due",
    reminderBadge: "Important",
    reminderDesc: "Maintenance schedule for some assets is due this week or overdue.",
    signatureLabel: "Recipient / Staff Signature *",
    clearSignature: "Clear",
    signatureHint: "Sign with finger here",
    signatureRequired: "Recipient signature is required!",
    printReceipt: "Print Receipt"
  }
};

const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=400&q=80";

const demoSimulationItems = [
  {
    id: "1",
    name: "Server Rack Node 2U Enterprise",
    code: "NST-001",
    category: "Network & Server",
    room: "Server Room",
    qty: 6,
    unit: "Unit",
    condition: "Baik",
    price: 18500000,
    supplier: "PT Data Sentosa",
    notes: "Production Core Infrastructure",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80",
    purchaseDate: "2024-01-10",
    usefulLife: "4",
    nextService: ""
  },
  {
    id: "2",
    name: "Workstation Ryzen 9 64GB DDR5",
    code: "NST-002",
    category: "Hardware IT",
    room: "Dev Studio",
    qty: 12,
    unit: "Unit",
    condition: "Baik",
    price: 24000000,
    supplier: "PT Sinar Teknologi",
    notes: "Dedicated Mobile & Web Engineering",
    image: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=400&q=80",
    purchaseDate: "2024-05-15",
    usefulLife: "4",
    nextService: ""
  },
  {
    id: "3",
    name: "Kamera Mirrorless Sony A7IV Kit",
    code: "NST-003",
    category: "Peralatan Studio/Kreatif",
    room: "Creative Lab",
    qty: 2,
    unit: "Unit",
    condition: "Baik",
    price: 36000000,
    supplier: "CV Media Visual",
    notes: "Perlengkapan produksi konten & promosi",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80",
    purchaseDate: "2025-02-01",
    usefulLife: "4",
    nextService: ""
  },
  {
    id: "4",
    name: "Ergonomic Mesh Chair High-Back",
    code: "NST-004",
    category: "Furniture Kantor",
    room: "Executive Office",
    qty: 16,
    unit: "Buah",
    condition: "Baik",
    price: 2100000,
    supplier: "CV Ergonomis Jaya",
    notes: "Fasilitas staf tim Axentra",
    image: "https://images.unsplash.com/photo-1580481077198-c847b4d8d145?auto=format&fit=crop&w=400&q=80",
    purchaseDate: "2023-08-20",
    usefulLife: "8",
    nextService: ""
  },
  {
    id: "5",
    name: "Switch Managed 24-Port Gigabit",
    code: "NST-005",
    category: "Network & Server",
    room: "Server Room",
    qty: 4,
    unit: "Unit",
    condition: "Baik",
    price: 4250000,
    supplier: "PT Data Sentosa",
    notes: "Distribusi jalur LAN lantai 4",
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80",
    purchaseDate: "2024-03-12",
    usefulLife: "4",
    nextService: ""
  }
];

// STATE GLOBAL
let currentSlideIndex = 0;
let currentAuthMode = "login";
let html5QrScannerInstance = null;
let currentActiveFilterCondition = "all";
let currentActiveServiceFilter = "all";
let itemPendingDeleteId = null;
let currentQrDisplayItem = null;
let currentPickerMode = "mutation";
let activeServiceTargetId = null;

// ELEMEN DOM
const splashScreen = document.getElementById("splashScreen");
const onboardingScreen = document.getElementById("onboardingScreen");
const landingGateScreen = document.getElementById("landingGateScreen");
const authModal = document.getElementById("authModal");
const switchAccountModal = document.getElementById("switchAccountModal");
const itemFormModal = document.getElementById("itemFormModal");
const mutationFormModal = document.getElementById("mutationFormModal");
const serviceFormModal = document.getElementById("serviceFormModal");
const serviceStatusModal = document.getElementById("serviceStatusModal");
const exportReportModal = document.getElementById("exportReportModal");
const lblStatusChangeItemTitle = document.getElementById("lblStatusChangeItemTitle");
const itemPickerModal = document.getElementById("itemPickerModal");
const pickerSheetTitle = document.getElementById("pickerSheetTitle");
const pickerSheetSubtitle = document.getElementById("pickerSheetSubtitle");
const qrDetailModal = document.getElementById("qrDetailModal");
const deleteConfirmModal = document.getElementById("deleteConfirmModal");
const editProfileModal = document.getElementById("editProfileModal");
const avatarActionsModal = document.getElementById("avatarActionsModal");
const logoutConfirmModal = document.getElementById("logoutConfirmModal");
const fullscreenScanner = document.getElementById("fullscreenScanner");
const mainApp = document.getElementById("mainApp");

const btnNextOnboarding = document.getElementById("btnNextOnboarding");
const btnSkipOnboarding = document.getElementById("btnSkipOnboarding");
const slides = document.querySelectorAll(".onboarding-slide");
const dots = document.querySelectorAll(".dots-indicator .dot");

const btnGateLogin = document.getElementById("btnGateLogin");
const btnGateRegister = document.getElementById("btnGateRegister");
const btnGateGuest = document.getElementById("btnGateGuest");

const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authSubmitText = document.getElementById("authSubmitText");
const authHeaderIcon = document.getElementById("authHeaderIcon");
const authAlert = document.getElementById("authAlert");
const authForm = document.getElementById("authForm");
const fieldUsername = document.getElementById("fieldUsername");
const inputUsername = document.getElementById("inputUsername");
const inputEmail = document.getElementById("inputEmail");
const fieldPassword = document.getElementById("fieldPassword");
const inputPassword = document.getElementById("inputPassword");
const authToggleText = document.getElementById("authToggleText");
const btnSwitchAuthMode = document.getElementById("btnSwitchAuthMode");
const btnGoogleAuth = document.getElementById("btnGoogleAuth");

const switchAccountsList = document.getElementById("switchAccountsList");
const btnAddNewAccountTrigger = document.getElementById("btnAddNewAccountTrigger");

const topbarUserProfileBtn = document.getElementById("topbarUserProfileBtn");
const btnTopbarSettings = document.getElementById("btnTopbarSettings");
const headerUserName = document.getElementById("headerUserName");
const headerAvatarContainer = document.getElementById("headerAvatarContainer");
const cloudStatusText = document.getElementById("cloudStatusText");

const profileCardAvatar = document.getElementById("profileCardAvatar");
const profileDisplayName = document.getElementById("profileDisplayName");
const profileDisplayRole = document.getElementById("profileDisplayRole");
const profileDisplayEmail = document.getElementById("profileDisplayEmail");
const btnEditProfileName = document.getElementById("btnEditProfileName");
const formEditProfile = document.getElementById("formEditProfile");
const inputEditProfileName = document.getElementById("inputEditProfileName");
const inputEditProfileRole = document.getElementById("inputEditProfileRole");
const btnCancelEditProfile = document.getElementById("btnCancelEditProfile");

const btnTriggerAvatarActions = document.getElementById("btnTriggerAvatarActions");
const inputUploadAvatarCamera = document.getElementById("inputUploadAvatarCamera");
const inputUploadAvatarGallery = document.getElementById("inputUploadAvatarGallery");
const btnDeleteAvatarPhoto = document.getElementById("btnDeleteAvatarPhoto");

const segThemeBtns = document.querySelectorAll("[data-theme-val]");
const segLangBtns = document.querySelectorAll("[data-lang-val]");

const btnBackupDatabase = document.getElementById("btnBackupDatabase");
const inputRestoreDatabase = document.getElementById("inputRestoreDatabase");
const btnSeedDefaultData = document.getElementById("btnSeedDefaultData");
const resetConfirmModal = document.getElementById("resetConfirmModal");
const btnCancelReset = document.getElementById("btnCancelReset");
const btnExecuteReset = document.getElementById("btnExecuteReset");
const btnSwitchAccount = document.getElementById("btnSwitchAccount");
const btnLogout = document.getElementById("btnLogout");
const btnSidebarLogout = document.getElementById("btnSidebarLogout");
const btnCancelLogout = document.getElementById("btnCancelLogout");
const btnExecuteLogout = document.getElementById("btnExecuteLogout");

const toastMessage = document.getElementById("toastMessage");
const btnSeeAllAssets = document.getElementById("btnSeeAllAssets");
const homeActivityFeed = document.getElementById("homeActivityFeed");
const qaScan = document.getElementById("qaScan");
const qaAdd = document.getElementById("qaAdd");
const qaMutate = document.getElementById("qaMutate");
const qaReport = document.getElementById("qaReport");

const formInventoryItem = document.getElementById("formInventoryItem");
const itemFormTitle = document.getElementById("itemFormTitle");
const editItemId = document.getElementById("editItemId");
const itemImageBase64 = document.getElementById("itemImageBase64");
const inputItemPhoto = document.getElementById("inputItemPhoto");
const inputItemPhotoCamera = document.getElementById("inputItemPhotoCamera");
const imgItemPreview = document.getElementById("imgItemPreview");
const itemPhotoPlaceholder = document.getElementById("itemPhotoPlaceholder");
const btnRemoveItemPhoto = document.getElementById("btnRemoveItemPhoto");

const btnToggleAdvancedFields = document.getElementById("btnToggleAdvancedFields");
const advancedFieldsContainer = document.getElementById("advancedFieldsContainer");
const inputItemName = document.getElementById("inputItemName");
const inputItemCode = document.getElementById("inputItemCode");
const selectItemCategory = document.getElementById("selectItemCategory");
const inputItemRoom = document.getElementById("inputItemRoom");
const selectItemCondition = document.getElementById("selectItemCondition");
const inputItemQty = document.getElementById("inputItemQty");
const selectItemUnit = document.getElementById("selectItemUnit");
const inputItemPrice = document.getElementById("inputItemPrice");
const inputItemSupplier = document.getElementById("inputItemSupplier");
const inputItemNotes = document.getElementById("inputItemNotes");
const inputPurchaseDate = document.getElementById("inputPurchaseDate");
const inputUsefulLife = document.getElementById("inputUsefulLife");
const inputAssetNextServiceDate = document.getElementById("assetNextServiceDate");
const btnCancelItemForm = document.getElementById("btnCancelItemForm");

const formMutation = document.getElementById("formMutation");
const btnTriggerItemPicker = document.getElementById("btnTriggerItemPicker");
const selectedMutateItemId = document.getElementById("selectedMutateItemId");
const lblSelectedItemName = document.getElementById("lblSelectedItemName");
const lblMutateSourceRoom = document.getElementById("lblMutateSourceRoom");
const lblMutateSourceQty = document.getElementById("lblMutateSourceQty");
const inputMutateQty = document.getElementById("inputMutateQty");
const inputMutateDestRoom = document.getElementById("inputMutateDestRoom");
const inputMutateNotes = document.getElementById("inputMutateNotes");
const btnCancelMutation = document.getElementById("btnCancelMutation");

// KANVAS TANDA TANGAN DIGITAL
const signatureCanvas = document.getElementById("signatureCanvas");
const btnClearSignature = document.getElementById("btnClearSignature");
const signatureHintText = document.getElementById("signatureHintText");
const inputSignatureBase64 = document.getElementById("inputSignatureBase64");
let sigContext = null;
let isSigning = false;
let hasDrawnSignature = false;

function initSignaturePad() {
  if (!signatureCanvas) return;
  sigContext = signatureCanvas.getContext("2d");

  const rect = signatureCanvas.getBoundingClientRect();
  signatureCanvas.width = rect.width || 320;
  signatureCanvas.height = rect.height || 110;

  sigContext.strokeStyle = "#1e293b";
  sigContext.lineWidth = 2.4;
  sigContext.lineCap = "round";
  sigContext.lineJoin = "round";

  function getCanvasCoords(e) {
    const box = signatureCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - box.left, y: clientY - box.top };
  }

  function startDrawing(e) {
    isSigning = true;
    hasDrawnSignature = true;
    if (signatureHintText) signatureHintText.style.display = "none";
    const coords = getCanvasCoords(e);
    sigContext.beginPath();
    sigContext.moveTo(coords.x, coords.y);
  }

  function drawStroke(e) {
    if (!isSigning) return;
    const coords = getCanvasCoords(e);
    sigContext.lineTo(coords.x, coords.y);
    sigContext.stroke();
  }

  function stopDrawing() {
    if (!isSigning) return;
    isSigning = false;
    if (inputSignatureBase64 && hasDrawnSignature) {
      inputSignatureBase64.value = signatureCanvas.toDataURL("image/png");
    }
  }

  signatureCanvas.addEventListener("touchstart", (e) => { e.preventDefault(); startDrawing(e); }, { passive: false });
  signatureCanvas.addEventListener("touchmove", (e) => { e.preventDefault(); drawStroke(e); }, { passive: false });
  signatureCanvas.addEventListener("touchend", stopDrawing);

  signatureCanvas.addEventListener("mousedown", startDrawing);
  signatureCanvas.addEventListener("mousemove", drawStroke);
  signatureCanvas.addEventListener("mouseup", stopDrawing);
}

function clearSignaturePad() {
  if (!signatureCanvas || !sigContext) return;
  sigContext.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  hasDrawnSignature = false;
  if (inputSignatureBase64) inputSignatureBase64.value = "";
  if (signatureHintText) signatureHintText.style.display = "block";
}

btnClearSignature?.addEventListener("click", clearSignaturePad);

const btnOpenMutasiModal = document.getElementById("btnOpenMutasiModal");
const mutationLogsContainer = document.getElementById("mutationLogsContainer");
const mutationsEmptyState = document.getElementById("mutationsEmptyState");
const inputSearchMutations = document.getElementById("inputSearchMutations");

const formService = document.getElementById("formService");
const btnOpenServiceModal = document.getElementById("btnOpenServiceModal");
const btnTriggerServiceItemPicker = document.getElementById("btnTriggerServiceItemPicker");
const selectedServiceItemId = document.getElementById("selectedServiceItemId");
const lblSelectedServiceItemName = document.getElementById("lblSelectedServiceItemName");
const inputServiceTech = document.getElementById("inputServiceTech");
const selectServiceStatus = document.getElementById("selectServiceStatus");
const inputServiceCost = document.getElementById("inputServiceCost");
const inputServiceNotes = document.getElementById("inputServiceNotes");
const btnCancelService = document.getElementById("btnCancelService");
const serviceLogsContainer = document.getElementById("serviceLogsContainer");
const servicesEmptyState = document.getElementById("servicesEmptyState");
const inputSearchServices = document.getElementById("inputSearchServices");
const serviceFilterChips = document.querySelectorAll(".service-filter-chip");

const pickerItemsList = document.getElementById("pickerItemsList");
const btnAsetScreenAdd = document.getElementById("btnAsetScreenAdd");
const inputSearchAssets = document.getElementById("inputSearchAssets");
const selectSortAssets = document.getElementById("selectSortAssets");

const filterChips = document.querySelectorAll(".chip:not(.service-filter-chip)");
const mobileItemsContainer = document.getElementById("mobileItemsContainer");
const desktopTableBody = document.getElementById("desktopTableBody");
const assetsEmptyState = document.getElementById("assetsEmptyState");

const detailItemPhotoImg = document.getElementById("detailItemPhotoImg");
const btnExitScanner = document.getElementById("btnExitScanner");
const btnPrintQr = document.getElementById("btnPrintQr");
const btnDownloadQr = document.getElementById("btnDownloadQr");

const btnCancelDelete = document.getElementById("btnCancelDelete");
const btnExecuteDelete = document.getElementById("btnExecuteDelete");

const navBtns = document.querySelectorAll(".nav-btn");
const bNavItems = document.querySelectorAll(".b-nav-item");

// ELEMEN FLOATING BAR AKSI MASSAL
const batchFloatingBar = document.getElementById("batchFloatingBar");
const batchSelectedCount = document.getElementById("batchSelectedCount");
const btnBatchMoveTrigger = document.getElementById("btnBatchMoveTrigger");
const btnBatchDeleteTrigger = document.getElementById("btnBatchDeleteTrigger");
const btnBatchClose = document.getElementById("btnBatchClose");
const batchMoveModal = document.getElementById("batchMoveModal");
const formBatchMove = document.getElementById("formBatchMove");
const inputBatchDestRoom = document.getElementById("inputBatchDestRoom");
const btnCancelBatchMove = document.getElementById("btnCancelBatchMove");

// ============================================================
// ENGINE DATA: DUAL STORAGE (LOCAL + SUPABASE CLOUD)
// ============================================================
function getCurrentUserSession() {
  try {
    const raw = localStorage.getItem(KEY_SESSION_USER);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function isGuestSession() {
  const session = getCurrentUserSession();
  return Boolean(session && session.isGuest);
}

function updateConnectionBadge() {
  if (!cloudStatusText) return;
  if (isGuestSession()) {
    cloudStatusText.textContent = "Guest Sandbox";
  } else if (navigator.onLine && supabaseClient) {
    cloudStatusText.textContent = "Supabase Cloud";
  } else {
    cloudStatusText.textContent = "Offline (Lokal)";
  }
}

window.addEventListener("online", () => {
  updateConnectionBadge();
  showToast("Koneksi tersambung. Menyinkronkan data...");
  processPendingSyncQueue();
});

window.addEventListener("offline", () => {
  updateConnectionBadge();
  showToast("Mode Offline: Data disimpan di perangkat.");
});

async function fetchAllActiveData() {
  updateConnectionBadge();

  if (isGuestSession()) {
    try {
      inMemoryItems = JSON.parse(localStorage.getItem(KEY_GUEST_ITEMS)) || [];
      inMemoryMutations = JSON.parse(localStorage.getItem(KEY_GUEST_MUTATIONS)) || [];
      inMemoryServices = JSON.parse(localStorage.getItem(KEY_GUEST_SERVICES)) || [];
    } catch {
      inMemoryItems = []; inMemoryMutations = []; inMemoryServices = [];
    }
    return;
  }

  try {
    inMemoryItems = JSON.parse(localStorage.getItem(KEY_LOCAL_ITEMS)) || [];
    inMemoryMutations = JSON.parse(localStorage.getItem(KEY_LOCAL_MUTATIONS)) || [];
    inMemoryServices = JSON.parse(localStorage.getItem(KEY_LOCAL_SERVICES)) || [];
  } catch {
    inMemoryItems = []; inMemoryMutations = []; inMemoryServices = [];
  }

  if (navigator.onLine && supabaseClient) {
    try {
      const [resItems, resMutations, resServices] = await Promise.all([
        supabaseClient.from("items").select("*").order("created_at", { ascending: false }),
        supabaseClient.from("mutations").select("*").order("created_at", { ascending: false }),
        supabaseClient.from("services").select("*").order("created_at", { ascending: false })
      ]);

      if (resItems && resItems.data) {
        const localItems = JSON.parse(localStorage.getItem(KEY_LOCAL_ITEMS)) || [];
        inMemoryItems = resItems.data.map(it => {
          const matchedLocal = localItems.find(l => String(l.id) === String(it.id));
          return {
            id: String(it.id),
            name: it.name,
            code: it.code,
            category: it.category,
            room: it.room,
            condition: it.condition,
            qty: Number(it.qty) || 1,
            unit: it.unit || "Unit",
            price: Number(it.price) || 0,
            supplier: it.supplier || "-",
            notes: it.notes || "-",
            image: it.image || DEFAULT_FALLBACK_IMAGE,
            purchaseDate: it.purchase_date || (matchedLocal && matchedLocal.purchaseDate) || "",
            usefulLife: it.useful_life || (matchedLocal && matchedLocal.usefulLife) || "4",
            nextService: it.next_service || (matchedLocal && matchedLocal.nextService) || ""
          };
        });
        localStorage.setItem(KEY_LOCAL_ITEMS, JSON.stringify(inMemoryItems));
      }
      
      if (resMutations && resMutations.data) {
        const localMuts = JSON.parse(localStorage.getItem(KEY_LOCAL_MUTATIONS)) || [];
        inMemoryMutations = resMutations.data.map(m => {
          const matchedLocal = localMuts.find(l => String(l.id) === String(m.id));
          return {
            id: String(m.id),
            itemName: m.item_name,
            itemCode: m.item_code,
            qty: m.qty,
            unit: m.unit,
            fromRoom: m.from_room,
            toRoom: m.to_room,
            date: m.date,
            by: m.by,
            notes: m.notes,
            image: m.image,
            signature: (matchedLocal && matchedLocal.signature) ? matchedLocal.signature : (m.signature || "")
          };
        });
        localStorage.setItem(KEY_LOCAL_MUTATIONS, JSON.stringify(inMemoryMutations));
      }

      if (resServices && resServices.data) {
        inMemoryServices = resServices.data.map(s => ({
          id: String(s.id),
          itemId: String(s.item_id),
          itemName: s.item_name,
          itemCode: s.item_code,
          room: s.room,
          technician: s.technician,
          status: s.status,
          cost: s.cost,
          notes: s.notes,
          date: s.date,
          image: s.image
        }));
        localStorage.setItem(KEY_LOCAL_SERVICES, JSON.stringify(inMemoryServices));
      }
    } catch (err) {
      console.warn("Gagal membaca cloud, menggunakan cache lokal:", err);
    }
  }
}

function pushToSyncQueue(actionType, table, payload) {
  try {
    const queue = JSON.parse(localStorage.getItem(KEY_PENDING_QUEUE)) || [];
    queue.push({ actionType, table, payload, timestamp: Date.now() });
    localStorage.setItem(KEY_PENDING_QUEUE, JSON.stringify(queue));
  } catch (e) {}
}

async function processPendingSyncQueue() {
  if (!navigator.onLine || !supabaseClient || isGuestSession()) return;
  try {
    const queue = JSON.parse(localStorage.getItem(KEY_PENDING_QUEUE)) || [];
    if (queue.length === 0) return;

    for (const item of queue) {
      if (item.actionType === "upsert") {
        await supabaseClient.from(item.table).upsert(item.payload);
      } else if (item.actionType === "delete") {
        await supabaseClient.from(item.table).delete().eq("id", item.payload.id);
      }
    }
    localStorage.removeItem(KEY_PENDING_QUEUE);
    showToast("Sinkronisasi cloud tuntas!");
  } catch (err) {
    console.warn("Gagal proses antrean sync:", err);
  }
}

async function saveItemsData(items) {
  inMemoryItems = items;
  if (isGuestSession()) {
    localStorage.setItem(KEY_GUEST_ITEMS, JSON.stringify(items));
    return;
  }
  
  localStorage.setItem(KEY_LOCAL_ITEMS, JSON.stringify(items));

  if (navigator.onLine && supabaseClient) {
    try {
      const cloudPayload = items.map(it => ({
        id: String(it.id),
        name: it.name,
        code: it.code,
        category: it.category,
        room: it.room,
        condition: it.condition,
        qty: Number(it.qty) || 1,
        unit: it.unit || "Unit",
        price: Number(it.price) || 0,
        supplier: it.supplier || "-",
        notes: it.notes || "-",
        image: it.image || "",
        purchase_date: it.purchaseDate || "",
        useful_life: it.usefulLife || "4",
        next_service: it.nextService || ""
      }));
      
      const { error } = await supabaseClient.from("items").upsert(cloudPayload);
      if (error) console.warn("Supabase upsert warning:", error.message);
    } catch (e) {
      pushToSyncQueue("upsert", "items", items);
    }
  } else {
    pushToSyncQueue("upsert", "items", items);
  }
}

async function saveMutationsData(mutations) {
  inMemoryMutations = mutations;
  if (isGuestSession()) {
    localStorage.setItem(KEY_GUEST_MUTATIONS, JSON.stringify(mutations));
    return;
  }

  localStorage.setItem(KEY_LOCAL_MUTATIONS, JSON.stringify(mutations));

  if (mutations.length > 0 && navigator.onLine && supabaseClient) {
    const latest = mutations[0];
    const payload = [{
      id: String(latest.id),
      item_name: latest.itemName,
      item_code: latest.itemCode,
      qty: latest.qty,
      unit: latest.unit,
      from_room: latest.fromRoom,
      to_room: latest.toRoom,
      date: latest.date,
      by: latest.by,
      notes: latest.notes,
      image: latest.image,
      signature: latest.signature || ""
    }];

    try {
      const { error } = await supabaseClient.from("mutations").insert(payload);
      if (error) console.warn("Supabase mutation warning:", error.message);
    } catch (e) {
      pushToSyncQueue("upsert", "mutations", payload);
    }
  }
}

async function saveServicesData(services) {
  inMemoryServices = services;
  if (isGuestSession()) {
    localStorage.setItem(KEY_GUEST_SERVICES, JSON.stringify(services));
    return;
  }

  localStorage.setItem(KEY_LOCAL_SERVICES, JSON.stringify(services));

  if (services.length > 0) {
    const latest = services[0];
    const payload = [{
      id: String(latest.id),
      item_id: String(latest.itemId),
      item_name: latest.itemName,
      item_code: latest.itemCode,
      room: latest.room,
      technician: latest.technician,
      status: latest.status,
      cost: latest.cost,
      notes: latest.notes,
      date: latest.date,
      image: latest.image
    }];

    if (navigator.onLine && supabaseClient) {
      try {
        await supabaseClient.from("services").upsert(payload);
      } catch (e) {
        pushToSyncQueue("upsert", "services", payload);
      }
    } else {
      pushToSyncQueue("upsert", "services", payload);
    }
  }
}

function getStoredItems() { return inMemoryItems; }
function getStoredMutations() { return inMemoryMutations; }
function getStoredServices() { return inMemoryServices; }

// ============================================================
// BAHASA & TEMA
// ============================================================
function setLanguage(lang) {
  const targetLang = (lang === "en") ? "en" : "id";
  localStorage.setItem(KEY_LANGUAGE, targetLang);

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (i18nDictionary[targetLang] && i18nDictionary[targetLang][key]) {
      el.textContent = i18nDictionary[targetLang][key];
    }
  });

  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    const key = el.dataset.i18nPh;
    if (i18nDictionary[targetLang] && i18nDictionary[targetLang][key]) {
      el.placeholder = i18nDictionary[targetLang][key];
    }
  });

  segLangBtns.forEach(btn => {
    btn?.classList.toggle("active", btn.dataset.langVal === targetLang);
  });

  renderAllData();
}

function applyTheme(themeMode) {
  localStorage.setItem(KEY_THEME, themeMode);
  
  if (themeMode === "dark") {
    document.body.classList.add("dark");
  } else if (themeMode === "light") {
    document.body.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.body.classList.toggle("dark", prefersDark);
  }

  segThemeBtns.forEach(btn => {
    btn?.classList.toggle("active", btn.dataset.themeVal === themeMode);
  });
}

segThemeBtns.forEach(btn => {
  btn?.addEventListener("click", () => {
    applyTheme(btn.dataset.themeVal);
    showToast(`Tema diubah: ${btn.dataset.themeVal}`);
  });
});

segLangBtns.forEach(btn => {
  btn?.addEventListener("click", () => {
    setLanguage(btn.dataset.langVal);
    showToast(`Language set to: ${btn.dataset.langVal.toUpperCase()}`);
  });
});

// ============================================================
// MODAL & NAVIGATION
// ============================================================
function openModalLayer(modalElement) {
  if (!modalElement) return;
  modalElement.classList.remove("hidden");
  
  const modalId = modalElement.dataset.modal || modalElement.id;
  history.pushState({ type: "modal", modalId: modalId }, "", `#${modalId}`);
}

function closeModalDirectly(modalElement) {
  if (!modalElement || modalElement.classList.contains("hidden")) return;
  if (modalElement === fullscreenScanner) stopFullscreenScanner();
  
  if (location.hash.includes(modalElement.dataset.modal || modalElement.id)) {
    history.back();
  } else {
    modalElement.classList.add("hidden");
  }
}

function closeActiveTopModal() {
  const activeSubModal = document.querySelector(".app-modal.sub-modal:not(.hidden)");
  if (activeSubModal) {
    closeModalDirectly(activeSubModal);
    return true;
  }

  const activeModal = document.querySelector(".app-modal:not(.hidden), .fullscreen-scanner:not(.hidden)");
  if (activeModal) {
    closeModalDirectly(activeModal);
    return true;
  }
  return false;
}

window.addEventListener("popstate", event => {
  const activeSubModal = document.querySelector(".app-modal.sub-modal:not(.hidden)");
  if (activeSubModal) {
    activeSubModal.classList.add("hidden");
    return;
  }

  const activeModal = document.querySelector(".app-modal:not(.hidden), .fullscreen-scanner:not(.hidden)");
  if (activeModal) {
    if (activeModal === fullscreenScanner) stopFullscreenScanner();
    activeModal.classList.add("hidden");
    return;
  }

  if (event.state && event.state.tab) {
    switchTabView(event.state.tab, false);
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (closeActiveTopModal()) e.preventDefault();
  }
});

document.addEventListener("click", e => {
  if (e.target.closest(".btn-close-modal")) {
    const modal = e.target.closest(".app-modal");
    closeModalDirectly(modal);
    return;
  }

  if (e.target.classList.contains("modal-backdrop")) {
    const modal = e.target.closest(".app-modal");
    closeModalDirectly(modal);
  }
});

btnCancelItemForm?.addEventListener("click", () => closeModalDirectly(itemFormModal));
btnCancelMutation?.addEventListener("click", () => closeModalDirectly(mutationFormModal));
btnCancelService?.addEventListener("click", () => closeModalDirectly(serviceFormModal));
btnCancelDelete?.addEventListener("click", () => closeModalDirectly(deleteConfirmModal));
btnCancelEditProfile?.addEventListener("click", () => closeModalDirectly(editProfileModal));
btnCancelLogout?.addEventListener("click", () => closeModalDirectly(logoutConfirmModal));
btnCancelBatchMove?.addEventListener("click", () => closeModalDirectly(batchMoveModal));

function initDragToDismiss() {
  const modalContainers = document.querySelectorAll(".modal-container");
  modalContainers.forEach(sheet => {
    const handle = sheet.querySelector(".sheet-drag-handle");
    if (!handle) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    handle.addEventListener("touchstart", e => {
      startY = e.touches[0].clientY;
      isDragging = true;
      sheet.style.transition = "none";
    }, { passive: true });

    handle.addEventListener("touchmove", e => {
      if (!isDragging) return;
      currentY = e.touches[0].clientY;
      const diffY = currentY - startY;

      if (diffY > 0) sheet.style.transform = `translateY(${diffY}px)`;
    }, { passive: true });

    handle.addEventListener("touchend", () => {
      if (!isDragging) return;
      isDragging = false;
      const diffY = currentY - startY;
      sheet.style.transition = "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)";

      if (diffY > 70) {
        sheet.style.transform = "translateY(100%)";
        setTimeout(() => {
          const parentModal = sheet.closest(".app-modal");
          closeModalDirectly(parentModal);
          sheet.style.transform = "";
        }, 180);
      } else {
        sheet.style.transform = "";
      }
    });
  });
}

// ============================================================
// ROUTER & INISIALISASI
// ============================================================
// Ganti dismissSplashInstantly & initAppFlow di script.js dengan ini:

let isSplashFinished = false;

function dismissSplashInstantly() {
  const splash = document.getElementById("splashScreen");
  if (splash) {
    splash.classList.add("hidden");
    splash.style.display = "none";
  }
}

function showScreen(screenName) {
  dismissSplashInstantly();

  const ob = document.getElementById("onboardingScreen");
  const lg = document.getElementById("landingGateScreen");
  const ma = document.getElementById("mainApp");

  if (ob) ob.classList.add("hidden");
  if (lg) lg.classList.add("hidden");
  if (ma) ma.classList.add("hidden");

  if (screenName === "onboarding" && ob) {
    ob.classList.remove("hidden");
    if (typeof updateSlide === "function") updateSlide(0);
  } else if (screenName === "gate" && lg) {
    lg.classList.remove("hidden");
  } else if (screenName === "app" && ma) {
    ma.classList.remove("hidden");
    if (typeof renderUserProfileHeader === "function") renderUserProfileHeader();
    if (typeof renderAllData === "function") renderAllData();
    if (typeof switchTabView === "function") switchTabView("home", false);
  }
}

async function initAppFlow() {
  // 1. Kunci paksa semua layar di awal eksekusi
  const ob = document.getElementById("onboardingScreen");
  const lg = document.getElementById("landingGateScreen");
  const ma = document.getElementById("mainApp");
  if (ob) ob.classList.add("hidden");
  if (lg) lg.classList.add("hidden");
  if (ma) ma.classList.add("hidden");

  try {
    const savedTheme = localStorage.getItem(KEY_THEME) || "auto";
    applyTheme(savedTheme);
    const savedLang = localStorage.getItem(KEY_LANGUAGE) || "id";
    setLanguage(savedLang);
  } catch (err) {}

  // 2. Auth Supabase HANYA mencatat sesi ke memory, TIDAK BOLEH memanggil showScreen
  if (supabaseClient) {
    try {
      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
          const u = session.user;
          const meta = u.user_metadata || {};
          const fullName = meta.full_name || meta.name || u.email.split("@")[0];
          const avatarUrl = meta.avatar_url || meta.picture || "";

          const userSession = {
            id: u.id,
            fullName: fullName,
            email: u.email,
            role: "PT NusaTech Digital Indonesia",
            avatar: avatarUrl,
            isGuest: false
          };

          saveRememberedAccount(userSession);
          localStorage.setItem(KEY_SESSION_USER, JSON.stringify(userSession));
          localStorage.setItem(KEY_HAS_ONBOARDED, "true");

          if (isSplashFinished) {
            showScreen("app");
            fetchAllActiveData().then(() => renderAllData());
          }
        }
      });
    } catch (err) {}
  }

  // 3. Eksekusi Tunggal setelah durasi Splash (2 Detik)
  setTimeout(() => {
    isSplashFinished = true;
    const hasOnboarded = localStorage.getItem(KEY_HAS_ONBOARDED) === "true";
    const currentSession = getCurrentUserSession();

    if (!hasOnboarded) {
      showScreen("onboarding");
    } else if (!currentSession) {
      showScreen("gate");
    } else {
      showScreen("app");
      fetchAllActiveData().then(() => renderAllData());
    }

    try {
      if (typeof initDragToDismiss === "function") initDragToDismiss();
    } catch (e) {}
  }, 2000);
}


  // Cadangan darurat jika layar tertahan
  setTimeout(() => {
    dismissSplashInstantly();
    const gate = document.getElementById("landingGateScreen");
    const app = document.getElementById("mainApp");
    const onb = document.getElementById("onboardingScreen");

    const anyActive = (app && !app.classList.contains("hidden")) ||
                      (gate && !gate.classList.contains("hidden")) ||
                      (onb && !onb.classList.contains("hidden"));

    if (!anyActive) {
      if (localStorage.getItem(KEY_SESSION_USER) && app) {
        app.classList.remove("hidden");
      } else if (gate) {
        gate.classList.remove("hidden");
      }
    }
  }, 1000);

function showScreen(screenName) {
  const splash = document.getElementById("splashScreen");
  const ob = document.getElementById("onboardingScreen");
  const lg = document.getElementById("landingGateScreen");
  const ma = document.getElementById("mainApp");

  // 1. Matikan SEMUA layar dan cabut class active
  if (ob) { ob.classList.add("hidden"); ob.classList.remove("active"); }
  if (lg) { lg.classList.add("hidden"); lg.classList.remove("active"); }
  if (ma) { ma.classList.add("hidden"); ma.classList.remove("active"); }

  // 2. Aktifkan HANYA layar yang diminta
  if (screenName === "onboarding" && ob) {
    ob.classList.remove("hidden");
    ob.classList.add("active");
    if (typeof updateSlide === "function") updateSlide(0);
  } else if (screenName === "gate" && lg) {
    lg.classList.remove("hidden");
    lg.classList.add("active");
  } else if (screenName === "app" && ma) {
    ma.classList.remove("hidden");
    ma.classList.add("active");
    if (typeof renderUserProfileHeader === "function") renderUserProfileHeader();
    if (typeof renderAllData === "function") renderAllData();
    if (typeof switchTabView === "function") switchTabView("home", false);
  }

  // 3. Tutup splash screen setelah layar tujuan aktif
  if (splash) {
    splash.classList.add("hidden");
    splash.style.display = "none";
  }
}

function showToast(msg) {
  if (!toastMessage) return;
  toastMessage.textContent = msg;
  toastMessage.classList.add("show");
  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => {
    toastMessage.classList.remove("show");
  }, 2200);
}

function switchTabView(tabKey, pushHistory = true) {
  if (!tabKey) tabKey = "home";

  document.querySelectorAll(".tab-view").forEach(view => {
    view.classList.add("hidden");
    view.classList.remove("active");
  });

  const tabMapping = {
    home: "tabViewHome",
    aset: "tabViewAset",
    mutasi: "tabViewMutasi",
    servis: "tabViewServis",
    menu: "tabViewMenu"
  };

  const targetId = tabMapping[tabKey] || ("tabView" + tabKey.charAt(0).toUpperCase() + tabKey.slice(1));
  const targetView = document.getElementById(targetId);

  if (targetView) {
    targetView.classList.remove("hidden");
    targetView.classList.add("active");
  }

  navBtns.forEach(b => b?.classList.toggle("active", b.dataset.nav === tabKey));
  bNavItems.forEach(b => b?.classList.toggle("active", b.dataset.nav === tabKey));

  if (pushHistory) {
    history.pushState({ tab: tabKey }, "", `#${tabKey}`);
  }

  window.scrollTo({ top: 0, behavior: "instant" });
}

navBtns.forEach(btn => btn?.addEventListener("click", () => switchTabView(btn.dataset.nav)));
bNavItems.forEach(item => item?.addEventListener("click", () => switchTabView(item.dataset.nav)));
btnSeeAllAssets?.addEventListener("click", () => switchTabView("aset"));
topbarUserProfileBtn?.addEventListener("click", () => switchTabView("menu"));
btnTopbarSettings?.addEventListener("click", () => switchTabView("menu"));

// ============================================================
// PROFIL PENGGUNA
// ============================================================
function renderUserProfileHeader() {
  const session = getCurrentUserSession() || { fullName: "Axentra", email: "admin@nusatech.co.id", role: "PT NusaTech Digital Indonesia", avatar: "" };
  
  if (headerUserName) headerUserName.textContent = session.fullName;
  if (profileDisplayName) profileDisplayName.textContent = session.fullName;
  if (profileDisplayRole) profileDisplayRole.textContent = session.role || "PT NusaTech Digital Indonesia";
  if (profileDisplayEmail) profileDisplayEmail.textContent = session.email;

  const initial = (session.fullName || "N").charAt(0).toUpperCase();

  if (session.avatar) {
    if (headerAvatarContainer) headerAvatarContainer.innerHTML = `<img src="${session.avatar}" alt="Avatar">`;
    if (profileCardAvatar) profileCardAvatar.innerHTML = `<img src="${session.avatar}" alt="Avatar">`;
  } else {
    if (headerAvatarContainer) headerAvatarContainer.innerHTML = `<span>${initial}</span>`;
    if (profileCardAvatar) profileCardAvatar.innerHTML = `<span>${initial}</span>`;
  }
}

btnEditProfileName?.addEventListener("click", () => {
  const session = getCurrentUserSession() || {};
  if (inputEditProfileName) inputEditProfileName.value = session.fullName || "Axentra";
  if (inputEditProfileRole) inputEditProfileRole.value = session.role || "PT NusaTech Digital Indonesia";
  openModalLayer(editProfileModal);
});

formEditProfile?.addEventListener("submit", async e => {
  e.preventDefault();
  const session = getCurrentUserSession() || {};
  const newName = inputEditProfileName?.value.trim();
  const newRole = inputEditProfileRole?.value.trim();

  if (!newName) {
    showToast("Nama tidak boleh kosong!");
    return;
  }

  session.fullName = newName;
  session.role = newRole || "PT NusaTech Digital Indonesia";
  localStorage.setItem(KEY_SESSION_USER, JSON.stringify(session));

  if (!isGuestSession() && supabaseClient) {
    try {
      await supabaseClient.auth.updateUser({
        data: { full_name: newName, role: session.role }
      });
    } catch (err) {}
  }

  renderUserProfileHeader();
  renderHomeMetrics();
  closeModalDirectly(editProfileModal);
  showToast("Profil berhasil diperbarui!");
});

btnTriggerAvatarActions?.addEventListener("click", () => {
  openModalLayer(avatarActionsModal);
});

function handleAvatarUpload(file) {
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showToast("Ukuran foto maksimal 2 MB!");
    return;
  }

  const reader = new FileReader();
  reader.onload = async ev => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const maxDim = 300;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) { height *= maxDim / width; width = maxDim; }
      } else {
        if (height > maxDim) { width *= maxDim / height; height = maxDim; }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const base64Img = canvas.toDataURL("image/jpeg", 0.8);
      const session = getCurrentUserSession() || {};
      session.avatar = base64Img;
      localStorage.setItem(KEY_SESSION_USER, JSON.stringify(session));

      if (!isGuestSession() && supabaseClient) {
        try {
          await supabaseClient.auth.updateUser({
            data: { avatar_url: base64Img }
          });
        } catch (err) {}
      }

      renderUserProfileHeader();
      closeModalDirectly(avatarActionsModal);
      showToast("Foto profil berhasil diperbarui!");
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

inputUploadAvatarCamera?.addEventListener("change", e => handleAvatarUpload(e.target.files[0]));
inputUploadAvatarGallery?.addEventListener("change", e => handleAvatarUpload(e.target.files[0]));

btnDeleteAvatarPhoto?.addEventListener("click", async () => {
  const session = getCurrentUserSession() || {};
  session.avatar = "";
  localStorage.setItem(KEY_SESSION_USER, JSON.stringify(session));

  if (!isGuestSession() && supabaseClient) {
    try {
      await supabaseClient.auth.updateUser({
        data: { avatar_url: "" }
      });
    } catch (err) {}
  }

  renderUserProfileHeader();
  closeModalDirectly(avatarActionsModal);
  showToast("Foto profil berhasil dihapus!");
});

// ============================================================
// FOTO BARANG (STORAGE BUCKET)
// ============================================================
async function handlePhotoUpload(file) {
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showToast("Ukuran foto maksimal 2 MB!");
    return;
  }

  const submitBtn = formInventoryItem?.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Mengunggah foto...";
  }

  showToast("Mengompres & memproses foto...");

  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const maxDim = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) { height *= maxDim / width; width = maxDim; }
      } else {
        if (height > maxDim) { width *= maxDim / height; height = maxDim; }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const visualPreview = canvas.toDataURL("image/jpeg", 0.7);
      if (imgItemPreview) {
        imgItemPreview.src = visualPreview;
        imgItemPreview.classList.remove("hidden");
      }
      itemPhotoPlaceholder?.classList.add("hidden");
      btnRemoveItemPhoto?.classList.remove("hidden");

      canvas.toBlob(async (blob) => {
        if (!blob) {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Simpan Aset"; }
          return;
        }

        if (isGuestSession() || !navigator.onLine || !supabaseClient) {
          if (itemImageBase64) itemImageBase64.value = visualPreview;
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Simpan Aset"; }
          showToast("Foto siap (Mode Tamu)");
          return;
        }

        try {
          const fileName = `item_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
          
          const { error: uploadErr } = await supabaseClient
            .storage
            .from("asset-image")
            .upload(fileName, blob, { contentType: "image/jpeg", upsert: true });

          if (uploadErr) throw uploadErr;

          const { data: publicData } = supabaseClient
            .storage
            .from("asset-image")
            .getPublicUrl(fileName);

          const publicImageUrl = publicData.publicUrl;
          if (itemImageBase64) itemImageBase64.value = publicImageUrl;
          showToast("Foto berhasil tersimpan di Cloud Storage!");
        } catch (err) {
          console.error("Gagal Storage:", err);
          showToast("Gagal unggah foto ke cloud. Cek izin storage.");
          if (itemImageBase64) itemImageBase64.value = "";
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Simpan Aset"; }
        }
      }, "image/jpeg", 0.8);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

inputItemPhoto?.addEventListener("change", e => handlePhotoUpload(e.target.files[0]));
inputItemPhotoCamera?.addEventListener("change", e => handlePhotoUpload(e.target.files[0]));

function setItemPhotoPreview(base64Url) {
  if (itemImageBase64) itemImageBase64.value = base64Url || "";
  if (base64Url) {
    if (imgItemPreview) {
      imgItemPreview.src = base64Url;
      imgItemPreview.classList.remove("hidden");
    }
    if (itemPhotoPlaceholder) itemPhotoPlaceholder.classList.add("hidden");
    if (btnRemoveItemPhoto) btnRemoveItemPhoto.classList.remove("hidden");
  } else {
    if (imgItemPreview) {
      imgItemPreview.src = "";
      imgItemPreview.classList.add("hidden");
    }
    if (itemPhotoPlaceholder) itemPhotoPlaceholder.classList.remove("hidden");
    if (btnRemoveItemPhoto) btnRemoveItemPhoto.classList.add("hidden");
    if (inputItemPhoto) inputItemPhoto.value = "";
    if (inputItemPhotoCamera) inputItemPhotoCamera.value = "";
  }
}

btnRemoveItemPhoto?.addEventListener("click", () => {
  setItemPhotoPreview("");
});

// ============================================================
// RENDER METRIK & VIEW
// ============================================================
function rupiahFormat(num) {
  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  if (currentLang === "en") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num || 0);
  }
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num || 0);
}

function calculateAssetDepreciation(price, purchaseDateStr, usefulLifeYears) {
  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  const t = i18nDictionary[currentLang] || i18nDictionary.id;
  const originalPrice = Number(price) || 0;

  if (!originalPrice || !purchaseDateStr) {
    return {
      currentValue: originalPrice,
      lostValue: 0,
      percentRemaining: 100,
      ageText: t.depAgeNoDate || "Data tanggal belum diatur"
    };
  }

  const purchaseDate = new Date(purchaseDateStr);
  const now = new Date();
  
  let monthsPassed = (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth());
  if (monthsPassed < 0) monthsPassed = 0;

  const totalLifeMonths = (parseInt(usefulLifeYears, 10) || 4) * 12;
  const monthlyDepreciation = originalPrice / totalLifeMonths;
  
  const totalDepreciation = Math.min(originalPrice, monthlyDepreciation * monthsPassed);
  const currentValue = Math.max(0, originalPrice - totalDepreciation);
  const percentRemaining = Math.max(0, Math.round((currentValue / originalPrice) * 100));

  const yearsPassed = Math.floor(monthsPassed / 12);
  const remMonths = monthsPassed % 12;
  const yUnit = t.yearUnit || "thn";
  const mUnit = t.monthUnit || "bln";
  const ageText = `${yearsPassed > 0 ? yearsPassed + ' ' + yUnit + ' ' : ''}${remMonths} ${mUnit}`;

  return {
    currentValue: Math.round(currentValue),
    lostValue: Math.round(totalDepreciation),
    percentRemaining: percentRemaining,
    ageText: `${t.depAgePrefix || "Usia:"} ${ageText}`
  };
}

function renderAllData() {
  renderDashboard();
  renderAssetsView();
  renderMutationsView();
  renderServicesView();
  if (typeof checkMaintenanceReminders === "function") checkMaintenanceReminders();
}

function renderDashboard() {
  renderHomeMetrics();
  if (typeof checkMaintenanceReminders === "function") checkMaintenanceReminders();
}

function renderHomeMetrics() {
  const session = getCurrentUserSession();
  const name = session ? (session.fullName || "Axentra") : "Axentra";
  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";

  if (headerUserName) headerUserName.textContent = name;

  const items = getStoredItems();
  const totalTypes = items.length;
  const totalUnits = items.reduce((acc, x) => acc + Number(x.qty || 0), 0);
  const totalValue = items.reduce((acc, x) => acc + (Number(x.qty || 0) * Number(x.price || 0)), 0);
  
  const roomSet = new Set(items.map(x => x.room).filter(Boolean));
  const totalRooms = roomSet.size;

  const cardAssetValue = document.getElementById("cardAssetValue");
  const cardTotalUnits = document.getElementById("cardTotalUnits");
  const cardTotalTypes = document.getElementById("cardTotalTypes");
  const cardTotalRooms = document.getElementById("cardTotalRooms");

  if (cardAssetValue) cardAssetValue.textContent = rupiahFormat(totalValue);
  if (cardTotalUnits) cardTotalUnits.textContent = totalUnits;
  if (cardTotalTypes) cardTotalTypes.textContent = totalTypes;
  if (cardTotalRooms) cardTotalRooms.textContent = totalRooms;

  const good = items.filter(x => x.condition === "Baik").reduce((acc, x) => acc + Number(x.qty || 0), 0);
  const minor = items.filter(x => x.condition === "Rusak Ringan").reduce((acc, x) => acc + Number(x.qty || 0), 0);
  const major = items.filter(x => x.condition === "Rusak Berat").reduce((acc, x) => acc + Number(x.qty || 0), 0);

  const denom = totalUnits || 1;
  const unitWord = (currentLang === "en") ? "Units" : "Unit";
  const condGoodText = document.getElementById("condGoodText");
  const condMinorText = document.getElementById("condMinorText");
  const condMajorText = document.getElementById("condMajorText");
  const barGood = document.getElementById("barGood");
  const barMinor = document.getElementById("barMinor");
  const barMajor = document.getElementById("barMajor");

  if (condGoodText) condGoodText.textContent = `${good} ${unitWord}`;
  if (condMinorText) condMinorText.textContent = `${minor} ${unitWord}`;
  if (condMajorText) condMajorText.textContent = `${major} ${unitWord}`;

  if (barGood) barGood.style.width = `${(good / denom) * 100}%`;
  if (barMinor) barMinor.style.width = `${(minor / denom) * 100}%`;
  if (barMajor) barMajor.style.width = `${(major / denom) * 100}%`;

  const roomCounts = {};
  items.forEach(x => {
    roomCounts[x.room] = (roomCounts[x.room] || 0) + Number(x.qty || 0);
  });

  const roomGrid = document.getElementById("roomTilesGrid");
  if (roomGrid) {
    roomGrid.innerHTML = Object.entries(roomCounts).map(([room, count]) => `
      <div class="room-tile">
        <span>${escapeHtml(room)}</span>
        <strong>${count} ${unitWord}</strong>
      </div>
    `).join("") || `<p style='color:var(--text-muted);font-size:12px;'>${(currentLang === "en") ? "No room data yet." : "Belum ada data ruangan."}</p>`;
  }

  if (homeActivityFeed) {
    const mutations = getStoredMutations().slice(0, 2);
    const services = getStoredServices().slice(0, 2);

    let html = "";
    mutations.forEach(m => {
      html += `
        <div class="act-card">
          <div class="act-icon"><i class="fa-solid fa-arrow-right-arrow-left"></i></div>
          <div class="act-details">
            <strong>${(currentLang === "en") ? "Transfer" : "Mutasi"} ${m.qty} ${escapeHtml(m.unit)} ${escapeHtml(m.itemName)}</strong>
            <small>${(currentLang === "en") ? "From" : "Dari"} ${escapeHtml(m.fromRoom)} ${(currentLang === "en") ? "to" : "ke"} ${escapeHtml(m.toRoom)} • ${escapeHtml(m.date)}</small>
          </div>
        </div>
      `;
    });

    services.forEach(s => {
      let statusLabel = s.status;
      if (currentLang === "en") {
        if (s.status === "Sedang Dikerjakan") statusLabel = "In Progress";
        if (s.status === "Dalam Antrean") statusLabel = "In Queue";
        if (s.status === "Selesai") statusLabel = "Completed";
      }

      html += `
        <div class="act-card">
          <div class="act-icon"><i class="fa-solid fa-screwdriver-wrench"></i></div>
          <div class="act-details">
            <strong>${(currentLang === "en") ? "Service" : "Servis"} ${escapeHtml(s.itemName)} (${escapeHtml(statusLabel)})</strong>
            <small>${escapeHtml(s.notes)} • ${escapeHtml(s.date)}</small>
          </div>
        </div>
      `;
    });

    homeActivityFeed.innerHTML = html || `
      <div class="act-card">
        <div class="act-icon"><i class="fa-solid fa-circle-check"></i></div>
        <div class="act-details">
          <strong>${(currentLang === "en") ? "System Ready" : "Sistem Terhubung"}</strong>
          <small>${(currentLang === "en") ? "Database synchronized" : "Proyek Manajemen Inventaris siap digunakan"}</small>
        </div>
      </div>
    `;
  }
}

// ============================================================
// LOGIKA LONG PRESS SELEKSI & MUTASI MASSAL
// ============================================================
let isSelectionMode = false;
let longPressTimer = null;

// Elemen Canvas TTD Batch Move
const batchSignatureCanvas = document.getElementById("batchSignatureCanvas");
const btnClearBatchSignature = document.getElementById("btnClearBatchSignature");
const batchSignatureHint = document.getElementById("batchSignatureHint");
const inputBatchSignatureBase64 = document.getElementById("inputBatchSignatureBase64");
const inputBatchMoveNotes = document.getElementById("inputBatchMoveNotes");

let batchSigContext = null;
let isBatchSigning = false;
let hasDrawnBatchSig = false;

function initBatchSignaturePad() {
  if (!batchSignatureCanvas) return;
  batchSigContext = batchSignatureCanvas.getContext("2d");
  const rect = batchSignatureCanvas.getBoundingClientRect();
  batchSignatureCanvas.width = rect.width || 320;
  batchSignatureCanvas.height = rect.height || 110;

  batchSigContext.strokeStyle = "#1e293b";
  batchSigContext.lineWidth = 2.4;
  batchSigContext.lineCap = "round";
  batchSigContext.lineJoin = "round";

  function getCoords(e) {
    const box = batchSignatureCanvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - box.left, y: cy - box.top };
  }

  function start(e) {
    isBatchSigning = true;
    hasDrawnBatchSig = true;
    if (batchSignatureHint) batchSignatureHint.style.display = "none";
    const c = getCoords(e);
    batchSigContext.beginPath();
    batchSigContext.moveTo(c.x, c.y);
  }

  function draw(e) {
    if (!isBatchSigning) return;
    const c = getCoords(e);
    batchSigContext.lineTo(c.x, c.y);
    batchSigContext.stroke();
  }

  function stop() {
    if (!isBatchSigning) return;
    isBatchSigning = false;
    if (inputBatchSignatureBase64 && hasDrawnBatchSig) {
      inputBatchSignatureBase64.value = batchSignatureCanvas.toDataURL("image/png");
    }
  }

  batchSignatureCanvas.addEventListener("touchstart", (e) => { e.preventDefault(); start(e); }, { passive: false });
  batchSignatureCanvas.addEventListener("touchmove", (e) => { e.preventDefault(); draw(e); }, { passive: false });
  batchSignatureCanvas.addEventListener("touchend", stop);
  batchSignatureCanvas.addEventListener("mousedown", start);
  batchSignatureCanvas.addEventListener("mousemove", draw);
  batchSignatureCanvas.addEventListener("mouseup", stop);
}

function clearBatchSignaturePad() {
  if (!batchSignatureCanvas || !batchSigContext) return;
  batchSigContext.clearRect(0, 0, batchSignatureCanvas.width, batchSignatureCanvas.height);
  hasDrawnBatchSig = false;
  if (inputBatchSignatureBase64) inputBatchSignatureBase64.value = "";
  if (batchSignatureHint) batchSignatureHint.style.display = "block";
}

btnClearBatchSignature?.addEventListener("click", clearBatchSignaturePad);

function updateBatchFloatingBar() {
  const count = selectedItemIds.size;
  if (count > 0) {
    isSelectionMode = true;
    document.body.classList.add("selection-mode");
    if (batchSelectedCount) batchSelectedCount.textContent = `${count} dipilih`;
    batchFloatingBar?.classList.add("show");
  } else {
    isSelectionMode = false;
    document.body.classList.remove("selection-mode");
    batchFloatingBar?.classList.remove("show");
  }
}

// Handler Long Press pada Kartu Aset
window.handleCardTouchStart = function(id, e) {
  longPressTimer = setTimeout(() => {
    if (navigator.vibrate) navigator.vibrate(50);
    window.toggleItemSelection(id, !selectedItemIds.has(id));
  }, 500);
};

window.handleCardTouchEnd = function() {
  clearTimeout(longPressTimer);
};

window.handleCardClick = function(id, e) {
  if (isSelectionMode) {
    if (e.target.closest(".btn-card-action")) return;
    window.toggleItemSelection(id, !selectedItemIds.has(id));
  }
};

window.toggleItemSelection = function(id, isChecked) {
  if (isChecked) {
    selectedItemIds.add(id);
  } else {
    selectedItemIds.delete(id);
  }
  updateBatchFloatingBar();
  
  const card = document.querySelector(`.item-mobile-card[data-item-id="${id}"]`);
  if (card) {
    card.classList.toggle("selected", isChecked);
    const cb = card.querySelector(".item-checkbox");
    if (cb) cb.checked = isChecked;
  }
};

btnBatchClose?.addEventListener("click", () => {
  selectedItemIds.clear();
  updateBatchFloatingBar();
  renderAssetsView();
});

btnBatchMoveTrigger?.addEventListener("click", () => {
  if (selectedItemIds.size === 0) return;
  if (inputBatchDestRoom) inputBatchDestRoom.value = "";
  if (inputBatchMoveNotes) inputBatchMoveNotes.value = "";
  clearBatchSignaturePad();

  const sub = document.getElementById("lblBatchMoveSub");
  if (sub) sub.textContent = `Pindahkan ${selectedItemIds.size} aset terpilih secara bersamaan`;
  
  openModalLayer(batchMoveModal);
  setTimeout(() => initBatchSignaturePad(), 150);
});

formBatchMove?.addEventListener("submit", async e => {
  e.preventDefault();

  if (!hasDrawnBatchSig || !inputBatchSignatureBase64?.value) {
    showToast("Tanda tangan penerima wajib dibubuhkan!");
    return;
  }

  const destRoom = inputBatchDestRoom?.value.trim();
  const notes = inputBatchMoveNotes?.value.trim() || "Mutasi massal";
  if (!destRoom) return;

  const items = [...getStoredItems()];
  const mutations = [...getStoredMutations()];
  const session = getCurrentUserSession();
  const officerName = session ? (session.fullName || "Axentra") : "Axentra";
  const now = new Date();
  const timeStr = `${now.getDate()} ${now.toLocaleString('id-ID', { month: 'short' })} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let movedCount = 0;

  items.forEach(it => {
    if (selectedItemIds.has(it.id)) {
      const originRoom = it.room;
      it.room = destRoom;

      mutations.unshift({
        id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        itemName: it.name,
        itemCode: it.code,
        qty: it.qty,
        unit: it.unit,
        fromRoom: originRoom,
        toRoom: destRoom,
        date: timeStr,
        by: officerName,
        notes: notes,
        image: it.image || DEFAULT_FALLBACK_IMAGE,
        signature: inputBatchSignatureBase64.value
      });

      movedCount++;
    }
  });

  await saveItemsData(items);
  await saveMutationsData(mutations);

  logActivity("mutate", `Mutasi Massal: ${movedCount} Aset`, `Memindahkan unit ke ruangan ${destRoom}`, "BATCH");

  selectedItemIds.clear();
  updateBatchFloatingBar();
  closeModalDirectly(batchMoveModal);
  renderAllData();
  showToast(`Berhasil memutasi ${movedCount} aset ke ${destRoom}!`);
});

// ============================================================
// RENDER ASSETS VIEW (DENGAN LONG-PRESS & CHECKBOX DINAMIS)
// ============================================================
function renderAssetsView() {
  const allItems = (typeof inMemoryItems !== "undefined" && inMemoryItems.length) 
    ? inMemoryItems 
    : (typeof getStoredItems === "function" ? getStoredItems() : []);
  
  const searchKeyword = (inputSearchAssets?.value || "").toLowerCase().trim();
  const sortBy = selectSortAssets ? selectSortAssets.value : "default";
  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  const t = i18nDictionary[currentLang] || i18nDictionary.id;

  let filtered = allItems.filter(item => {
    const matchSearch = `${item.name} ${item.code} ${item.room || item.location || ''} ${item.category}`.toLowerCase().includes(searchKeyword);
    const matchCondition = currentActiveFilterCondition === "all" || item.condition === currentActiveFilterCondition;
    return matchSearch && matchCondition;
  });

  if (sortBy === "name-asc") {
    filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } else if (sortBy === "name-desc") {
    filtered.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
  } else if (sortBy === "stock-desc") {
    filtered.sort((a, b) => (Number(b.qty) || 0) - (Number(a.qty) || 0));
  } else if (sortBy === "stock-asc") {
    filtered.sort((a, b) => (Number(a.qty) || 0) - (Number(b.qty) || 0));
  } else if (sortBy === "price-desc") {
    filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else if (sortBy === "price-asc") {
    filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  }

  assetsEmptyState?.classList.toggle("hidden", filtered.length > 0);

  // Render Kartu Mobile
  if (mobileItemsContainer) {
    mobileItemsContainer.innerHTML = filtered.map(item => {
      const imgSrc = item.image || DEFAULT_FALLBACK_IMAGE;
      const isChecked = selectedItemIds.has(item.id);

      let condText = item.condition;
      if (currentLang === "en") {
        if (item.condition === "Baik") condText = "Good";
        if (item.condition === "Rusak Ringan") condText = "Minor Damage";
        if (item.condition === "Rusak Berat") condText = "Critical Damage";
      }

      return `
        <div class="item-mobile-card ${isChecked ? 'selected' : ''}" 
             data-item-id="${item.id}"
             ontouchstart="handleCardTouchStart('${item.id}', event)"
             ontouchend="handleCardTouchEnd()"
             onclick="handleCardClick('${item.id}', event)">
          <div class="card-main-info">
            <div class="card-main-info-with-thumb">
              <input type="checkbox" class="item-checkbox" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation()" onchange="toggleItemSelection('${item.id}', this.checked)">
              <img src="${imgSrc}" alt="${escapeHtml(item.name)}" class="card-item-thumb" onerror="this.src='${DEFAULT_FALLBACK_IMAGE}'">
              <div>
                <h4>${escapeHtml(item.name)}</h4>
                <span>${escapeHtml(item.code)} • ${escapeHtml(item.category)}</span>
              </div>
            </div>
            <span class="cond-pill ${item.condition === 'Baik' ? 'good' : (item.condition === 'Rusak Ringan' ? 'warn' : 'danger')}">
              ${escapeHtml(condText)}
            </span>
          </div>

          <div class="card-details-strip">
            <div><i class="fa-solid fa-door-open" style="margin-right:4px;"></i> ${escapeHtml(item.room)}</div>
            <div><strong>${item.qty}</strong> ${escapeHtml(item.unit)}</div>
            <div>${rupiahFormat(item.price)}</div>
          </div>

          <div class="card-actions-row">
            <button type="button" class="btn-card-action" onclick="showItemQrModal('${item.id}')">
              <i class="fa-solid fa-qrcode"></i> QR
            </button>
            <button type="button" class="btn-card-action" onclick="openEditItemForm('${item.id}')">
              <i class="fa-solid fa-pen-to-square"></i> ${t.cardBtnEdit}
            </button>
            <button type="button" class="btn-card-action del" onclick="confirmDeleteItem('${item.id}')">
              <i class="fa-solid fa-trash-can"></i> ${t.cardBtnDelete}
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  // Render Tabel Desktop
  if (desktopTableBody) {
    desktopTableBody.innerHTML = filtered.map((item, idx) => {
      const imgSrc = item.image || DEFAULT_FALLBACK_IMAGE;
      const isChecked = selectedItemIds.has(item.id);

      let condText = item.condition;
      if (currentLang === "en") {
        if (item.condition === "Baik") condText = "Good";
        if (item.condition === "Rusak Ringan") condText = "Minor Damage";
        if (item.condition === "Rusak Berat") condText = "Critical Damage";
      }

      return `
        <tr>
          <td>
            <input type="checkbox" class="item-checkbox" ${isChecked ? 'checked' : ''} onchange="toggleItemSelection('${item.id}', this.checked)">
          </td>
          <td>
            <img src="${imgSrc}" alt="${escapeHtml(item.name)}" class="table-item-thumb" onerror="this.src='${DEFAULT_FALLBACK_IMAGE}'">
          </td>
          <td><strong>${escapeHtml(item.name)}</strong></td>
          <td><span style="color:var(--primary); font-weight:700;">${escapeHtml(item.code)}</span></td>
          <td>${escapeHtml(item.category)}</td>
          <td>${escapeHtml(item.room)}</td>
          <td>${item.qty} ${escapeHtml(item.unit)}</td>
          <td>
            <span class="cond-pill ${item.condition === 'Baik' ? 'good' : (item.condition === 'Rusak Ringan' ? 'warn' : 'danger')}">
              ${escapeHtml(condText)}
            </span>
          </td>
          <td style="text-align: right;">
            <div style="display:inline-flex; gap:6px;">
              <button type="button" class="btn-card-action" onclick="showItemQrModal('${item.id}')" title="Detail & QR">
                <i class="fa-solid fa-qrcode"></i>
              </button>
              <button type="button" class="btn-card-action" onclick="openEditItemForm('${item.id}')" title="${t.cardBtnEdit}">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button type="button" class="btn-card-action del" onclick="confirmDeleteItem('${item.id}')" title="${t.cardBtnDelete}">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }
}

// ============================================================
// RENDER MUTASI & CETAK SURAT JALAN
// ============================================================
function renderMutationsView() {
  const mutations = getStoredMutations();
  const items = getStoredItems();
  const searchKeyword = (inputSearchMutations?.value || "").toLowerCase().trim();
  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  const t = i18nDictionary[currentLang] || i18nDictionary.id;

  const filtered = mutations.filter(m => 
    `${m.itemName} ${m.itemCode} ${m.fromRoom} ${m.toRoom} ${m.by}`.toLowerCase().includes(searchKeyword)
  );

  mutationsEmptyState?.classList.toggle("hidden", filtered.length > 0);

  if (mutationLogsContainer) {
    mutationLogsContainer.innerHTML = filtered.map(m => {
      const matchedItem = items.find(x => x.code === m.itemCode || x.name.toLowerCase() === m.itemName.toLowerCase());
      const imgSrc = m.image || matchedItem?.image || DEFAULT_FALLBACK_IMAGE;

      return `
        <div class="mutation-card">
          <div class="mutation-card-header">
            <div class="card-header-with-thumb">
              <img src="${imgSrc}" alt="${escapeHtml(m.itemName)}" class="mutation-item-thumb" onerror="this.src='${DEFAULT_FALLBACK_IMAGE}'">
              <div>
                <h4>${escapeHtml(m.itemName)}</h4>
                <small>${escapeHtml(m.itemCode)} • <strong>${m.qty} ${escapeHtml(m.unit)}</strong></small>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <small>${escapeHtml(m.date)}</small>
              <button type="button" class="btn-sm-action outline" style="padding: 3px 8px; font-size: 10px; border-radius: 8px;" onclick="printMutationReceipt('${m.id}')">
                <i class="fa-solid fa-print"></i> ${t.printReceipt || "Cetak Bukti"}
              </button>
            </div>
          </div>

          <div class="mutation-flow-badge">
            <span class="flow-room">${escapeHtml(m.fromRoom)}</span>
            <i class="fa-solid fa-arrow-right"></i>
            <span class="flow-room">${escapeHtml(m.toRoom)}</span>
          </div>

          <div class="mutation-footer-meta" style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span><i class="fa-regular fa-user" style="margin-right: 4px;"></i> ${escapeHtml(m.by)}</span>
              <span style="font-size: 11px; opacity: 0.8;"><em>"${escapeHtml(m.notes)}"</em></span>
            </div>
            ${m.signature ? `
              <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                <span style="font-size: 9px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">TTD Penerima</span>
                <div style="background: #ffffff; padding: 3px 8px; border-radius: 6px; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                  <img src="${m.signature}" alt="TTD" style="height: 24px; max-width: 70px; object-fit: contain;">
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join("");
  }
}

window.printMutationReceipt = function(mutationId) {
  const mutations = getStoredMutations();
  const m = mutations.find(x => x.id === mutationId);
  if (!m) {
    showToast("Data mutasi tidak ditemukan!");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Izin pop-up terblokir oleh browser. Izinkan pop-up untuk mencetak bukti serah terima.");
    return;
  }

  const docNumber = `BA-MUT/${m.id.replace('m-', '')}`;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Surat Bukti Mutasi - ${escapeHtml(m.itemCode)}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 15px; font-size: 12px; line-height: 1.4; }
          .kop { display: flex; align-items: center; justify-content: center; border-bottom: 2.5px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; text-align: center; }
          .kop h2 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; }
          .kop h4 { margin: 3px 0; font-size: 13px; font-weight: 700; color: #2563eb; }
          .kop p { margin: 0; font-size: 10px; color: #475569; }
          .doc-title { text-align: center; margin-bottom: 16px; }
          .doc-title h3 { margin: 0; font-size: 14px; text-transform: uppercase; font-weight: 800; text-decoration: underline; }
          .doc-title span { font-size: 11px; color: #475569; font-weight: 600; }
          .statement { margin-bottom: 16px; font-size: 12px; }
          table.detail-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          table.detail-table th, table.detail-table td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; }
          table.detail-table th { background: #f8fafc; font-weight: 700; width: 30%; }
          .signatures-wrap { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; }
          .sig-box { text-align: center; width: 220px; }
          .sig-box p { margin: 0 0 6px 0; font-size: 11px; }
          .sig-img-container { height: 70px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
          .sig-img-container img { max-height: 65px; max-width: 140px; object-fit: contain; }
          .sig-line { border-bottom: 1px solid #0f172a; margin-top: 4px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="kop">
          <div>
            <h2>PT NUSATECH DIGITAL INDONESIA</h2>
            <h4>DIVISI OPERASIONAL & MANAJEMEN ASET</h4>
            <p>Gedung Axentra Tower, Lantai 4 • Telp: (021) 8892-019 • support@nusatech.co.id</p>
          </div>
        </div>

        <div class="doc-title">
          <h3>BERITA ACARA SERAH TERIMA / MUTASI BARANG</h3>
          <span>Nomor: ${docNumber}</span>
        </div>

        <p class="statement">
          Pada hari ini telah dilakukan serah terima pemindahan aset inventaris operasional dengan rincian berikut:
        </p>

        <table class="detail-table">
          <tr><th>Kode Aset</th><td><strong>${escapeHtml(m.itemCode)}</strong></td></tr>
          <tr><th>Nama Barang / Perangkat</th><td><strong>${escapeHtml(m.itemName)}</strong></td></tr>
          <tr><th>Jumlah Fisik Dipindahkan</th><td><strong>${m.qty} ${escapeHtml(m.unit)}</strong></td></tr>
          <tr><th>Ruangan Asal</th><td>${escapeHtml(m.fromRoom)}</td></tr>
          <tr><th>Ruangan Tujuan</th><td><strong style="color: #2563eb;">${escapeHtml(m.toRoom)}</strong></td></tr>
          <tr><th>Waktu & Tanggal Mutasi</th><td>${escapeHtml(m.date)}</td></tr>
          <tr><th>Alasan / Keterangan Serah Terima</th><td><em>"${escapeHtml(m.notes)}"</em></td></tr>
        </table>

        <p style="font-size: 11px; color: #475569; margin-bottom: 24px;">
          Barang yang diserahterimakan telah diperiksa secara fisik dalam kondisi baik dan siap digunakan di ruangan tujuan operasional.
        </p>

        <div class="signatures-wrap">
          <div class="sig-box">
            <p>Petugas Penyerah / Mutasi,<br><strong>Custodian Staff</strong></p>
            <div class="sig-img-container">
              <span style="font-size: 10px; color: #94a3b8; font-style: italic;">[Terverifikasi Sistem]</span>
            </div>
            <div class="sig-line"></div>
            <p style="margin-top: 4px; font-weight: bold;">${escapeHtml(m.by)}</p>
          </div>

          <div class="sig-box">
            <p>Penerima Barang / Petugas Ruangan,<br><strong>Penanggung Jawab</strong></p>
            <div class="sig-img-container">
              ${m.signature ? `<img src="${m.signature}" alt="TTD Penerima">` : '<span style="font-size: 10px; color: #94a3b8;">[Belum Dibubuhkan]</span>'}
            </div>
            <div class="sig-line"></div>
            <p style="margin-top: 4px; font-weight: bold;">( Tanda Tangan Sah Penerima )</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// ============================================================
// RENDER SERVIS VIEW
// ============================================================
function renderServicesView() {
  const services = getStoredServices();
  const items = getStoredItems();
  const searchKeyword = (inputSearchServices?.value || "").toLowerCase().trim();
  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  const t = i18nDictionary[currentLang] || i18nDictionary.id;

  const filtered = services.filter(s => {
    const matchSearch = `${s.itemName} ${s.itemCode} ${s.room} ${s.technician} ${s.notes}`.toLowerCase().includes(searchKeyword);
    const matchStatus = currentActiveServiceFilter === "all" || s.status === currentActiveServiceFilter;
    return matchSearch && matchStatus;
  });

  servicesEmptyState?.classList.toggle("hidden", filtered.length > 0);

  if (serviceLogsContainer) {
    serviceLogsContainer.innerHTML = filtered.map(s => {
      let statusClass = "queue";
      let statusLabel = s.status;

      if (s.status === "Sedang Dikerjakan") {
        statusClass = "progress";
        statusLabel = (currentLang === "en") ? "In Progress" : "Sedang Dikerjakan";
      } else if (s.status === "Selesai") {
        statusClass = "done";
        statusLabel = (currentLang === "en") ? "Completed" : "Selesai";
      } else if (s.status === "Dalam Antrean") {
        statusLabel = (currentLang === "en") ? "In Queue" : "Dalam Antrean";
      }

      const matchedItem = items.find(x => x.id === s.itemId || x.code === s.itemCode);
      const imgSrc = s.image || matchedItem?.image || DEFAULT_FALLBACK_IMAGE;

      return `
        <div class="service-card">
          <div class="service-card-header">
            <div class="card-header-with-thumb">
              <img src="${imgSrc}" alt="${escapeHtml(s.itemName)}" class="service-item-thumb" onerror="this.src='${DEFAULT_FALLBACK_IMAGE}'">
              <div>
                <h4>${escapeHtml(s.itemName)}</h4>
                <small>${escapeHtml(s.itemCode)} • ${escapeHtml(s.room)}</small>
              </div>
            </div>
            <span class="status-pill ${statusClass}">${escapeHtml(statusLabel)}</span>
          </div>

          <div class="service-actions-strip">
            <div><strong>${t.costLabel}:</strong> ${rupiahFormat(s.cost)}</div>
            <button type="button" class="btn-cycle-status" onclick="openServiceStatusModal('${s.id}')">
              <i class="fa-solid fa-sliders"></i> ${t.changeStatusBtn}
            </button>
          </div>

          <div class="service-footer-meta">
            <span><i class="fa-solid fa-wrench"></i> ${escapeHtml(s.technician)}</span>
            <span><em>"${escapeHtml(s.notes)}"</em></span>
          </div>
        </div>
      `;
    }).join("");
  }
}

inputSearchAssets?.addEventListener("input", renderAssetsView);
selectSortAssets?.addEventListener("change", renderAssetsView);
inputSearchMutations?.addEventListener("input", renderMutationsView);
inputSearchServices?.addEventListener("input", renderServicesView);

filterChips.forEach(chip => {
  chip?.addEventListener("click", () => {
    filterChips.forEach(c => c?.classList.remove("active"));
    chip.classList.add("active");
    currentActiveFilterCondition = chip.dataset.filter;
    renderAssetsView();
  });
});

serviceFilterChips.forEach(chip => {
  chip?.addEventListener("click", () => {
    serviceFilterChips.forEach(c => c?.classList.remove("active"));
    chip.classList.add("active");
    currentActiveServiceFilter = chip.dataset.sfilter;
    renderServicesView();
  });
});

// ============================================================
// CRUD ASET
// ============================================================
function openCreateItemForm() {
  if (!formInventoryItem) return;
  formInventoryItem.reset();
  if (editItemId) editItemId.value = "";
  if (inputAssetNextServiceDate) inputAssetNextServiceDate.value = "";
  if (inputPurchaseDate) inputPurchaseDate.value = new Date().toISOString().split("T")[0];
  if (inputUsefulLife) inputUsefulLife.value = "4";

  setItemPhotoPreview("");
  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  if (itemFormTitle) {
    itemFormTitle.textContent = (currentLang === "en") ? "Add New Asset" : "Tambah Aset Baru";
  }
  if (advancedFieldsContainer) advancedFieldsContainer.classList.add("hidden");
  if (btnToggleAdvancedFields) btnToggleAdvancedFields.classList.remove("open");
  openModalLayer(itemFormModal);
}

qaAdd?.addEventListener("click", openCreateItemForm);
btnAsetScreenAdd?.addEventListener("click", openCreateItemForm);

window.openEditItemForm = function(id) {
  const items = getStoredItems();
  const target = items.find(x => x.id === id);
  if (!target) return;

  if (editItemId) editItemId.value = target.id;
  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  if (itemFormTitle) {
    itemFormTitle.textContent = (currentLang === "en") ? "Edit Asset Details" : "Edit Spesifikasi Aset";
  }
  if (inputItemName) inputItemName.value = target.name;
  if (inputItemCode) inputItemCode.value = target.code;
  if (selectItemCategory) selectItemCategory.value = target.category;
  if (inputItemRoom) inputItemRoom.value = target.room;
  if (selectItemCondition) selectItemCondition.value = target.condition;
  if (inputItemQty) inputItemQty.value = target.qty;
  if (selectItemUnit) selectItemUnit.value = target.unit;
  if (inputItemPrice) inputItemPrice.value = target.price || 0;
  if (inputItemSupplier) inputItemSupplier.value = (target.supplier && target.supplier !== "-") ? target.supplier : "";
  if (inputItemNotes) inputItemNotes.value = (target.notes && target.notes !== "-") ? target.notes : "";
  if (inputAssetNextServiceDate) inputAssetNextServiceDate.value = target.nextService || "";
  if (inputPurchaseDate) inputPurchaseDate.value = target.purchaseDate || "";
  if (inputUsefulLife) inputUsefulLife.value = target.usefulLife || "4";

  setItemPhotoPreview(target.image || "");

  if (advancedFieldsContainer) advancedFieldsContainer.classList.remove("hidden");
  if (btnToggleAdvancedFields) btnToggleAdvancedFields.classList.add("open");
  openModalLayer(itemFormModal);
};

btnToggleAdvancedFields?.addEventListener("click", () => {
  if (!advancedFieldsContainer) return;
  const isHidden = advancedFieldsContainer.classList.contains("hidden");
  advancedFieldsContainer.classList.toggle("hidden", !isHidden);
  btnToggleAdvancedFields.classList.toggle("open", isHidden);
});

formInventoryItem?.addEventListener("submit", async e => {
  e.preventDefault();

  const items = [...getStoredItems()];
  const isEdit = Boolean(editItemId?.value);
  const code = inputItemCode ? inputItemCode.value.trim().toUpperCase() : "";

  if (items.some(x => x.code.toUpperCase() === code && x.id !== editItemId?.value)) {
    showToast(`Kode aset [${code}] sudah dipakai barang lain!`);
    return;
  }

  const nextServiceValue = inputAssetNextServiceDate ? inputAssetNextServiceDate.value : "";

  const payload = {
    name: inputItemName?.value.trim() || "Aset",
    code: code,
    category: selectItemCategory?.value || "Lainnya",
    room: inputItemRoom?.value.trim() || "-",
    condition: selectItemCondition?.value || "Baik",
    qty: Math.max(1, parseInt(inputItemQty?.value, 10) || 1),
    unit: selectItemUnit?.value || "Unit",
    price: Math.max(0, parseInt(inputItemPrice?.value, 10) || 0),
    supplier: inputItemSupplier?.value.trim() || "-",
    notes: inputItemNotes?.value.trim() || "-",
    image: itemImageBase64?.value || DEFAULT_FALLBACK_IMAGE,
    nextService: nextServiceValue,
    purchaseDate: inputPurchaseDate ? inputPurchaseDate.value : "",
    usefulLife: inputUsefulLife ? inputUsefulLife.value : "4"
  };

  if (isEdit) {
    const idx = items.findIndex(x => x.id === editItemId.value);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...payload };
      showToast(`Aset [${payload.name}] berhasil diperbarui!`);
    }
    logActivity("edit", `Mengubah Aset: ${payload.name}`, `Spesifikasi barang (${payload.code}) diperbarui`, payload.code);
  } else {
    const newItem = { id: Date.now().toString(), ...payload };
    items.unshift(newItem);
    showToast(`Aset [${payload.name}] berhasil dicatat!`);
  }
  logActivity("create", `Tambah Aset Baru: ${payload.name}`, `Mendaftarkan unit baru di ruangan ${payload.room}`, payload.code);

  await saveItemsData(items);
  renderAllData();
  closeModalDirectly(itemFormModal);
});

window.confirmDeleteItem = function(id) {
  const items = getStoredItems();
  const target = items.find(x => x.id === id);
  if (!target) return;

  itemPendingDeleteId = id;
  const delName = document.getElementById("delItemName");
  const delCode = document.getElementById("delItemCode");
  if (delName) delName.textContent = target.name;
  if (delCode) delCode.textContent = target.code;
  openModalLayer(deleteConfirmModal);
};

btnExecuteDelete?.addEventListener("click", async () => {
  if (!itemPendingDeleteId) return;

  let items = getStoredItems();
  const deletedItem = items.find(x => x.id === itemPendingDeleteId);
  items = items.filter(x => x.id !== itemPendingDeleteId);

  if (!isGuestSession()) {
    if (navigator.onLine && supabaseClient) {
      try {
        await supabaseClient.from("items").delete().eq("id", itemPendingDeleteId);
      } catch (e) {
        pushToSyncQueue("delete", "items", { id: itemPendingDeleteId });
      }
    } else {
      pushToSyncQueue("delete", "items", { id: itemPendingDeleteId });
    }
  }

  await saveItemsData(items);
  showToast(`Aset [${deletedItem?.name || 'Barang'}] berhasil dihapus`);
  logActivity("delete", `Menghapus Aset: ${deletedItem?.name || 'Barang'}`, `Unit dengan kode ${deletedItem?.code || '-'} dihapus dari inventaris`, deletedItem?.code);

  itemPendingDeleteId = null;
  renderAllData();
  closeModalDirectly(deleteConfirmModal);
});

window.showItemQrModal = function(id) {
  const items = getStoredItems();
  const target = items.find(x => x.id === id);
  if (!target) return;

  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  const t = i18nDictionary[currentLang] || i18nDictionary.id;
  currentQrDisplayItem = target;
  
  const qrName = document.getElementById("qrDisplayName");
  const qrCode = document.getElementById("qrDisplayCode");
  const qrRoom = document.getElementById("qrDisplayRoom");
  
  if (qrName) qrName.textContent = target.name;
  if (qrCode) qrCode.textContent = target.code;
  if (qrRoom) qrRoom.textContent = target.room;

  if (detailItemPhotoImg) {
    detailItemPhotoImg.src = target.image || DEFAULT_FALLBACK_IMAGE;
  }

  let condText = target.condition;
  if (currentLang === "en") {
    if (target.condition === "Baik") condText = "Good";
    if (target.condition === "Rusak Ringan") condText = "Minor Damage";
    if (target.condition === "Rusak Berat") condText = "Critical Damage";
  }

  const badge = document.getElementById("qrDisplayBadge");
  if (badge) {
    badge.textContent = condText;
    badge.className = `cond-pill ${target.condition === 'Baik' ? 'good' : (target.condition === 'Rusak Ringan' ? 'warn' : 'danger')}`;
  }

  const lblCategory = (currentLang === "en") ? "Category" : "Kategori";
  const lblStock = (currentLang === "en") ? "Quantity" : "Stok";
  const lblPrice = (currentLang === "en") ? "Purchase Price" : "Harga Beli";
  const lblVendor = (currentLang === "en") ? "Vendor / Supplier" : "Vendor";
  const lblNotes = (currentLang === "en") ? "Notes" : "Keterangan";

  const qrInfoList = document.getElementById("qrInfoList");
  if (qrInfoList) {
    qrInfoList.innerHTML = `
      <div class="qr-info-row"><span>${lblCategory}</span><strong>${escapeHtml(target.category)}</strong></div>
      <div class="qr-info-row"><span>${lblStock}</span><strong>${target.qty} ${escapeHtml(target.unit)}</strong></div>
      <div class="qr-info-row"><span>${lblPrice}</span><strong>${rupiahFormat(target.price)}</strong></div>
      <div class="qr-info-row"><span>${lblVendor}</span><strong>${escapeHtml(target.supplier)}</strong></div>
      <div class="qr-info-row"><span>${lblNotes}</span><strong>${escapeHtml(target.notes)}</strong></div>
    `;
  }

  const qrContainer = document.getElementById("qrCanvasContainer");
  if (qrContainer) {
    qrContainer.innerHTML = "";
    if (typeof QRCode !== "undefined") {
      new QRCode(qrContainer, {
        text: target.code,
        width: 140,
        height: 140,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  }

  const dep = calculateAssetDepreciation(target.price, target.purchaseDate, target.usefulLife);
  const depVal = document.getElementById("depreciationCurrentValue");
  const depLost = document.getElementById("depreciationLostValue");
  const depBadge = document.getElementById("depreciationAgeBadge");
  const depBar = document.getElementById("depreciationProgressBar");

  if (depVal) depVal.textContent = rupiahFormat(dep.currentValue);
  if (depLost) {
    const lossLabel = t.depLoss || "Penyusutan";
    depLost.textContent = `${lossLabel}: -${rupiahFormat(dep.lostValue)}`;
  }
  if (depBadge) depBadge.textContent = dep.ageText;
  if (depBar) {
    depBar.style.width = `${dep.percentRemaining}%`;
    depBar.style.background = dep.percentRemaining > 50 ? "#10b981" : (dep.percentRemaining > 20 ? "#f59e0b" : "#ef4444");
  }

  openModalLayer(qrDetailModal);
};

btnDownloadQr?.addEventListener("click", () => {
  if (!currentQrDisplayItem) return;
  const canvas = document.querySelector("#qrCanvasContainer canvas");
  const img = document.querySelector("#qrCanvasContainer img");
  const url = canvas?.toDataURL("image/png") || img?.src;
  if (!url) return;

  const a = document.createElement("a");
  a.href = url;
  a.download = `QR_${currentQrDisplayItem.code}.png`;
  a.click();
  showToast("Gambar stiker QR diunduh");
});

btnPrintQr?.addEventListener("click", () => {
  if (!currentQrDisplayItem) return;
  const canvas = document.querySelector("#qrCanvasContainer canvas");
  const img = document.querySelector("#qrCanvasContainer img");
  const src = canvas?.toDataURL("image/png") || img?.src;
  
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`
    <html>
      <head>
        <title>Cetak QR - ${escapeHtml(currentQrDisplayItem.code)}</title>
        <style>
          body { text-align: center; font-family: sans-serif; padding: 20px; }
          .label-box { border: 2px dashed #000; display: inline-block; padding: 16px; border-radius: 12px; }
          h3 { margin: 0 0 4px; font-size: 16px; }
          p { margin: 0 0 10px; font-size: 12px; color: #555; }
        </style>
      </head>
      <body>
        <div class="label-box">
          <h3>${escapeHtml(currentQrDisplayItem.name)}</h3>
          <p>${escapeHtml(currentQrDisplayItem.code)} • ${escapeHtml(currentQrDisplayItem.room)}</p>
          <img src="${src}" style="width: 160px; height: 160px;">
          <p style="margin-top: 8px;">PT NusaTech Digital Indonesia</p>
        </div>
        <script>window.onload = () => window.print();<\/script>
      </body>
    </html>
  `);
  w.document.close();
});

// ============================================================
// FORM MUTASI & SERVIS
// ============================================================
function openMutationModal() {
  if (selectedMutateItemId) selectedMutateItemId.value = "";
  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  if (lblSelectedItemName) {
    lblSelectedItemName.textContent = (currentLang === "en") ? "Choose an inventory item..." : "Pilih barang inventaris...";
    lblSelectedItemName.classList.add("placeholder-text");
  }
  if (lblMutateSourceRoom) lblMutateSourceRoom.textContent = "-";
  if (lblMutateSourceQty) lblMutateSourceQty.textContent = "0";
  if (inputMutateQty) inputMutateQty.value = 1;
  if (inputMutateDestRoom) inputMutateDestRoom.value = "";
  if (inputMutateNotes) inputMutateNotes.value = "";

  clearSignaturePad();
  openModalLayer(mutationFormModal);

  setTimeout(() => {
    initSignaturePad();
  }, 150);
}

btnTriggerItemPicker?.addEventListener("click", () => {
  currentPickerMode = "mutation";
  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  if (pickerSheetTitle) {
    pickerSheetTitle.textContent = (currentLang === "en") ? "Select Asset to Move" : "Pilih Aset untuk Mutasi";
  }
  if (pickerSheetSubtitle) {
    pickerSheetSubtitle.textContent = (currentLang === "en") ? "Tap item you want to transfer" : "Sentuh barang yang hendak dipindahkan";
  }
  renderPickerItems(getStoredItems());
  openModalLayer(itemPickerModal);
});

function openServiceModal() {
  if (selectedServiceItemId) selectedServiceItemId.value = "";
  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  if (lblSelectedServiceItemName) {
    lblSelectedServiceItemName.textContent = (currentLang === "en") ? "Select damaged asset..." : "Pilih aset yang rusak...";
    lblSelectedServiceItemName.classList.add("placeholder-text");
  }
  if (inputServiceTech) inputServiceTech.value = "Tim IT Support";
  if (selectServiceStatus) selectServiceStatus.value = "Sedang Dikerjakan";
  if (inputServiceCost) inputServiceCost.value = "";
  if (inputServiceNotes) inputServiceNotes.value = "";

  openModalLayer(serviceFormModal);
}

btnTriggerServiceItemPicker?.addEventListener("click", () => {
  currentPickerMode = "service";
  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  if (pickerSheetTitle) {
    pickerSheetTitle.textContent = (currentLang === "en") ? "Select Asset for Service" : "Pilih Aset untuk Servis";
  }
  if (pickerSheetSubtitle) {
    pickerSheetSubtitle.textContent = (currentLang === "en") ? "Choose equipment with technical issues" : "Pilih barang yang mengalami kendala teknis";
  }
  renderPickerItems(getStoredItems());
  openModalLayer(itemPickerModal);
});

function renderPickerItems(items) {
  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  if (!pickerItemsList) return;

  if (items.length === 0) {
    pickerItemsList.innerHTML = `<p style='text-align:center;color:var(--text-muted);font-size:12px;'>${(currentLang === "en") ? "No items available." : "Belum ada data barang."}</p>`;
    return;
  }

  pickerItemsList.innerHTML = items.map(item => `
    <div class="picker-item-card" onclick="handleItemPicked('${item.id}')">
      <div class="picker-item-info">
        <strong>${escapeHtml(item.name)}</strong>
        <small>${escapeHtml(item.code)} • ${escapeHtml(item.room)} (${escapeHtml(item.condition)})</small>
      </div>
      <div class="picker-item-stock">
        ${item.qty} ${escapeHtml(item.unit)}
      </div>
    </div>
  `).join("");
}

window.handleItemPicked = function(id) {
  const items = getStoredItems();
  const selected = items.find(x => x.id === id);
  if (!selected) return;

  if (currentPickerMode === "mutation") {
    if (selectedMutateItemId) selectedMutateItemId.value = selected.id;
    if (lblSelectedItemName) {
      lblSelectedItemName.textContent = `${selected.name} (${selected.code})`;
      lblSelectedItemName.classList.remove("placeholder-text");
    }
    if (lblMutateSourceRoom) lblMutateSourceRoom.textContent = selected.room;
    if (lblMutateSourceQty) lblMutateSourceQty.textContent = selected.qty;
    if (inputMutateQty) inputMutateQty.max = selected.qty;
  } else {
    if (selectedServiceItemId) selectedServiceItemId.value = selected.id;
    if (lblSelectedServiceItemName) {
      lblSelectedServiceItemName.textContent = `${selected.name} (${selected.code}) - ${selected.room}`;
      lblSelectedServiceItemName.classList.remove("placeholder-text");
    }
  }

  closeModalDirectly(itemPickerModal);
};

btnOpenMutasiModal?.addEventListener("click", openMutationModal);
qaMutate?.addEventListener("click", openMutationModal);
btnOpenServiceModal?.addEventListener("click", openServiceModal);

formMutation?.addEventListener("submit", async e => {
  e.preventDefault();

  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  const t = i18nDictionary[currentLang] || i18nDictionary.id;
  
  if (!hasDrawnSignature || !inputSignatureBase64?.value) {
    showToast(t.signatureRequired || "Tanda tangan penerima wajib dibubuhkan!");
    return;
  }

  const targetId = selectedMutateItemId?.value;
  if (!targetId) {
    showToast("Pilih barang yang hendak dipindahkan terlebih dahulu!");
    return;
  }

  const items = [...getStoredItems()];
  const moveQty = parseInt(inputMutateQty?.value, 10);
  const destRoom = inputMutateDestRoom?.value.trim() || "-";
  const notes = inputMutateNotes?.value.trim() || "-";

  if (!Number.isInteger(moveQty) || moveQty <= 0) {
    showToast("Jumlah unit harus berupa angka bulat lebih dari 0!");
    return;
  }

  const sourceIndex = items.findIndex(x => x.id === targetId);
  if (sourceIndex === -1) {
    showToast("Aset tidak ditemukan!");
    return;
  }

  const sourceItem = items[sourceIndex];

  if (moveQty > sourceItem.qty) {
    showToast(`Jumlah melebihi stok tersedia (${sourceItem.qty} unit)!`);
    return;
  }

  if (sourceItem.room.toLowerCase() === destRoom.toLowerCase()) {
    showToast("Ruangan tujuan tidak boleh sama dengan ruangan asal!");
    return;
  }

  const originRoomName = sourceItem.room;

  if (moveQty === sourceItem.qty) {
    sourceItem.room = destRoom;
  } else {
    sourceItem.qty -= moveQty;

    const existingInDest = items.find(x => 
      x.name.toLowerCase() === sourceItem.name.toLowerCase() && 
      x.room.toLowerCase() === destRoom.toLowerCase()
    );

    if (existingInDest) {
      existingInDest.qty += moveQty;
    } else {
      const splitItem = {
        ...sourceItem,
        id: Date.now().toString(),
        code: `${sourceItem.code}-M`,
        room: destRoom,
        qty: moveQty
      };
      items.push(splitItem);
    }
  }

  await saveItemsData(items);

  const session = getCurrentUserSession();
  const officerName = session ? (session.fullName || "Axentra") : "Axentra";
  const now = new Date();
  const timeStr = `${now.getDate()} ${now.toLocaleString('id-ID', { month: 'short' })} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const mutations = [...getStoredMutations()];
  mutations.unshift({
    id: `m-${Date.now()}`,
    itemName: sourceItem.name,
    itemCode: sourceItem.code,
    qty: moveQty,
    unit: sourceItem.unit,
    fromRoom: originRoomName,
    toRoom: destRoom,
    date: timeStr,
    by: officerName,
    notes: notes,
    image: sourceItem.image || DEFAULT_FALLBACK_IMAGE,
    signature: inputSignatureBase64 ? inputSignatureBase64.value : ""
  });
  await saveMutationsData(mutations);

  showToast(`Berhasil memindahkan ${moveQty} ${sourceItem.unit} ke ${destRoom}!`);
  logActivity("mutate", `Mutasi: ${sourceItem.name}`, `Memindahkan ${moveQty} unit dari ${originRoomName} ke ${destRoom}`, sourceItem.code);

  renderAllData();
  closeModalDirectly(mutationFormModal);
  switchTabView("mutasi");
});

formService?.addEventListener("submit", async e => {
  e.preventDefault();

  const targetId = selectedServiceItemId?.value;
  if (!targetId) {
    showToast("Pilih barang yang hendak diservis terlebih dahulu!");
    return;
  }

  const items = [...getStoredItems()];
  const targetItem = items.find(x => x.id === targetId);
  if (!targetItem) {
    showToast("Data barang tidak ditemukan!");
    return;
  }

  const tech = inputServiceTech?.value.trim() || "Tim IT Support";
  const status = selectServiceStatus?.value || "Sedang Dikerjakan";
  const cost = Math.max(0, parseInt(inputServiceCost?.value, 10) || 0);
  const notes = inputServiceNotes?.value.trim() || "-";

  if (status !== "Selesai" && targetItem.condition === "Baik") {
    targetItem.condition = "Rusak Ringan";
    await saveItemsData(items);
  }

  const now = new Date();
  const timeStr = `${now.getDate()} ${now.toLocaleString('id-ID', { month: 'short' })} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const services = [...getStoredServices()];
  services.unshift({
    id: `s-${Date.now()}`,
    itemId: targetItem.id,
    itemName: targetItem.name,
    itemCode: targetItem.code,
    room: targetItem.room,
    technician: tech,
    status: status,
    cost: cost,
    notes: notes,
    date: timeStr,
    image: targetItem.image || DEFAULT_FALLBACK_IMAGE
  });
  await saveServicesData(services);

  showToast(`Catatan servis untuk [${targetItem.name}] disimpan!`);
  logActivity("service", `Pencatatan Servis: ${targetItem.name}`, `Ditangani oleh ${tech} (Status: ${status})`, targetItem.code);

  renderAllData();
  closeModalDirectly(serviceFormModal);
  switchTabView("servis");
});

window.openServiceStatusModal = function(serviceId) {
  const services = getStoredServices();
  const current = services.find(x => x.id === serviceId);
  if (!current) return;

  activeServiceTargetId = serviceId;
  if (lblStatusChangeItemTitle) {
    lblStatusChangeItemTitle.textContent = `${current.itemName} (${current.itemCode})`;
  }
  openModalLayer(serviceStatusModal);
};

window.applyServiceStatusChange = async function(newStatus) {
  if (!activeServiceTargetId) return;

  const services = [...getStoredServices()];
  const current = services.find(x => x.id === activeServiceTargetId);
  if (!current) return;

  current.status = newStatus;

  if (newStatus === "Selesai") {
    const items = [...getStoredItems()];
    const itemTarget = items.find(x => x.id === current.itemId || x.code === current.itemCode);
    if (itemTarget) {
      itemTarget.condition = "Baik";
      itemTarget.nextService = ""; 
      await saveItemsData(items);
      showToast(`Status Selesai! Kondisi [${itemTarget.name}] pulih.`);
    }
  }

  await saveServicesData(services);
  renderAllData();
  closeModalDirectly(serviceStatusModal);
  showToast(`Status diperbarui menjadi "${newStatus}"`);
  logActivity("service", `Perubahan Status Servis: ${current.itemName}`, `Status diperbarui menjadi "${newStatus}"`, current.itemCode);
};

// ============================================================
// CADANGKAN & PULIHKAN DATABASE (JSON)
// ============================================================
btnBackupDatabase?.addEventListener("click", () => {
  const fullBackup = {
    app: "NusaTech",
    organization: "PT NusaTech Digital Indonesia",
    team: "Axentra",
    timestamp: new Date().toISOString(),
    items: getStoredItems(),
    mutations: getStoredMutations(),
    services: getStoredServices()
  };

  const jsonStr = JSON.stringify(fullBackup, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const now = new Date();
  a.href = url;
  a.download = `Backup_NusaTech_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Database berhasil dicadangkan ke file JSON!");
});

inputRestoreDatabase?.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.items || !Array.isArray(data.items)) throw new Error("Format JSON tidak valid");

      await saveItemsData(data.items);
      if (data.mutations) await saveMutationsData(data.mutations);
      if (data.services) await saveServicesData(data.services);

      renderAllData();
      showToast("Database berhasil dipulihkan dari file JSON!");
    } catch (err) {
      showToast("Gagal memulihkan: Format file tidak sesuai!");
    }
  };
  reader.readAsText(file);
});

// ============================================================
// EKSPOR LAPORAN
// ============================================================
window.openExportReportModal = function() {
  openModalLayer(exportReportModal);
};

qaReport?.addEventListener("click", openExportReportModal);

window.exportDataToCsv = function(type) {
  let csvContent = "\uFEFF";
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const filename = `NusaTech_${type}_${dateStr}.csv`;

  if (type === "items") {
    csvContent += "No;Kode Aset;Nama Barang;Kategori;Ruangan;Kondisi;Jumlah;Satuan;Harga Satuan;Total Nilai;Vendor;Catatan\n";
    const items = getStoredItems();
    items.forEach((x, idx) => {
      const total = Number(x.qty || 0) * Number(x.price || 0);
      csvContent += `${idx + 1};"${(x.code || '').replace(/"/g, '""')}";"${(x.name || '').replace(/"/g, '""')}";"${(x.category || '').replace(/"/g, '""')}";"${(x.room || '').replace(/"/g, '""')}";"${(x.condition || 'Baik').replace(/"/g, '""')}";${x.qty || 1};"${(x.unit || 'Unit').replace(/"/g, '""')}";${x.price || 0};${total};"${(x.supplier || '-').replace(/"/g, '""')}";"${(x.notes || '-').replace(/"/g, '""')}"\n`;
    });
  } else if (type === "mutations") {
    csvContent += "No;Kode Aset;Nama Barang;Jumlah;Satuan;Ruang Asal;Ruang Tujuan;Waktu Mutasi;Petugas;Keterangan\n";
    const mutations = getStoredMutations();
    mutations.forEach((x, idx) => {
      csvContent += `${idx + 1};"${(x.itemCode || '').replace(/"/g, '""')}";"${(x.itemName || '').replace(/"/g, '""')}";${x.qty || 1};"${(x.unit || 'Unit').replace(/"/g, '""')}";"${(x.fromRoom || '').replace(/"/g, '""')}";"${(x.toRoom || '').replace(/"/g, '""')}";"${(x.date || '').replace(/"/g, '""')}";"${(x.by || '').replace(/"/g, '""')}";"${(x.notes || '-').replace(/"/g, '""')}"\n`;
    });
  } else if (type === "services") {
    csvContent += "No;Kode Aset;Nama Barang;Ruangan;Status;Biaya;Teknisi;Tanggal;Catatan Kerusakan\n";
    const services = getStoredServices();
    services.forEach((x, idx) => {
      csvContent += `${idx + 1};"${(x.itemCode || '').replace(/"/g, '""')}";"${(x.itemName || '').replace(/"/g, '""')}";"${(x.room || '').replace(/"/g, '""')}";"${(x.status || '').replace(/"/g, '""')}";${x.cost || 0};"${(x.technician || '').replace(/"/g, '""')}";"${(x.date || '').replace(/"/g, '""')}";"${(x.notes || '-').replace(/"/g, '""')}"\n`;
    });
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`File CSV [${filename}] berhasil diunduh!`);
};

window.exportDataToExcelStyled = function(type) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const filename = `NusaTech_${type}_${dateStr}.xls`;

  let tableHeaderHTML = "";
  let tableRowsHTML = "";
  let reportTitle = "";

  if (type === "items") {
    reportTitle = "BUKU INDUK INVENTARIS ASET - NUSATECH";
    tableHeaderHTML = `
      <tr style="background-color: #1e3a8a; color: #ffffff; font-weight: bold; text-align: center; height: 35px;">
        <th style="border: 1px solid #cbd5e1; padding: 6px;">No</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Kode Aset</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Nama Barang</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Kategori</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Ruangan</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Kondisi</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Jumlah</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Satuan</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Harga Satuan (Rp)</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Total Nilai (Rp)</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Vendor / Toko</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Catatan Spesifikasi</th>
      </tr>
    `;
    const items = getStoredItems();
    items.forEach((x, idx) => {
      const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      const total = Number(x.qty || 0) * Number(x.price || 0);
      tableRowsHTML += `
        <tr style="background-color: ${rowBg}; height: 28px;">
          <td style="border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: bold; color: #2563eb;">${escapeHtml(x.code)}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: bold;">${escapeHtml(x.name)}</td>
          <td style="border: 1px solid #cbd5e1;">${escapeHtml(x.category)}</td>
          <td style="border: 1px solid #cbd5e1;">${escapeHtml(x.room)}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">${escapeHtml(x.condition)}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">${x.qty || 1}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">${escapeHtml(x.unit || 'Unit')}</td>
          <td style="border: 1px solid #cbd5e1; text-align: right;">${Number(x.price || 0).toLocaleString('id-ID')}</td>
          <td style="border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">${total.toLocaleString('id-ID')}</td>
          <td style="border: 1px solid #cbd5e1;">${escapeHtml(x.supplier || '-')}</td>
          <td style="border: 1px solid #cbd5e1;">${escapeHtml(x.notes || '-')}</td>
        </tr>
      `;
    });
  } else if (type === "mutations") {
    reportTitle = "LAPORAN HISTORI MUTASI ASET - NUSATECH";
    tableHeaderHTML = `
      <tr style="background-color: #6d28d9; color: #ffffff; font-weight: bold; text-align: center; height: 35px;">
        <th style="border: 1px solid #cbd5e1; padding: 6px;">No</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Kode Aset</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Nama Barang</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Jumlah Unit</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Ruang Asal</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Ruang Tujuan</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Waktu Mutasi</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Petugas</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Keterangan</th>
      </tr>
    `;
    const mutations = getStoredMutations();
    mutations.forEach((x, idx) => {
      const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      tableRowsHTML += `
        <tr style="background-color: ${rowBg}; height: 28px;">
          <td style="border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: bold; color: #7c3aed;">${escapeHtml(x.itemCode)}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: bold;">${escapeHtml(x.itemName)}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">${x.qty} ${escapeHtml(x.unit)}</td>
          <td style="border: 1px solid #cbd5e1;">${escapeHtml(x.fromRoom)}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: bold; color: #16a34a;">${escapeHtml(x.toRoom)}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">${escapeHtml(x.date)}</td>
          <td style="border: 1px solid #cbd5e1;">${escapeHtml(x.by)}</td>
          <td style="border: 1px solid #cbd5e1;">${escapeHtml(x.notes || '-')}</td>
        </tr>
      `;
    });
  } else if (type === "services") {
    reportTitle = "REKAPITULASI PEMELIHARAAN & SERVIS - NUSATECH";
    tableHeaderHTML = `
      <tr style="background-color: #047857; color: #ffffff; font-weight: bold; text-align: center; height: 35px;">
        <th style="border: 1px solid #cbd5e1; padding: 6px;">No</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Kode Aset</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Nama Barang</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Lokasi</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Status Servis</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Biaya Servis (Rp)</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Teknisi / Vendor</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Tanggal Masuk</th>
        <th style="border: 1px solid #cbd5e1; padding: 6px;">Deskripsi Kendala</th>
      </tr>
    `;
    const services = getStoredServices();
    services.forEach((x, idx) => {
      const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      tableRowsHTML += `
        <tr style="background-color: ${rowBg}; height: 28px;">
          <td style="border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">${escapeHtml(x.itemCode)}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: bold;">${escapeHtml(x.itemName)}</td>
          <td style="border: 1px solid #cbd5e1;">${escapeHtml(x.room)}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${escapeHtml(x.status)}</td>
          <td style="border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">${Number(x.cost || 0).toLocaleString('id-ID')}</td>
          <td style="border: 1px solid #cbd5e1;">${escapeHtml(x.technician)}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">${escapeHtml(x.date)}</td>
          <td style="border: 1px solid #cbd5e1;">${escapeHtml(x.notes || '-')}</td>
        </tr>
      `;
    });
  }

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head>
      <body>
        <table>
          <tr><td colspan="7" style="font-size: 16pt; font-weight: bold; color: #1e3a8a; height: 35px;">${reportTitle}</td></tr>
          <tr><td colspan="7" style="font-size: 10pt; color: #64748b; height: 20px;">Dicetak Otomatis oleh Sistem Axentra • PT NusaTech Digital Indonesia</td></tr>
          <tr><td style="height: 12px;"></td></tr>
          ${tableHeaderHTML}
          ${tableRowsHTML}
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`File Excel resmi [${filename}] berhasil diunduh!`);
};

window.printOfficialReport = function(type) {
  const now = new Date();
  const dateFormatted = `${now.getDate()} ${now.toLocaleString('id-ID', { month: 'long' })} ${now.getFullYear()}`;
  let title = "LAPORAN INVENTARIS ASET";
  let tableHeaders = "";
  let tableRows = "";
  let totalFinancialValue = 0;

  if (type === "items") {
    title = "BUKU INDUK INVENTARIS SARANA & PRASARANA";
    tableHeaders = "<th>No</th><th>Kode</th><th>Nama Barang</th><th>Kategori</th><th>Lokasi</th><th>Stok</th><th>Kondisi</th><th>Harga Satuan</th><th>Total Nilai</th>";
    const items = getStoredItems();
    items.forEach((x, idx) => {
      const lineTotal = Number(x.qty || 0) * Number(x.price || 0);
      totalFinancialValue += lineTotal;
      tableRows += `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td><code>${escapeHtml(x.code)}</code></td>
          <td><strong>${escapeHtml(x.name)}</strong></td>
          <td>${escapeHtml(x.category)}</td>
          <td>${escapeHtml(x.room)}</td>
          <td style="text-align:center;">${x.qty} ${escapeHtml(x.unit)}</td>
          <td>${escapeHtml(x.condition)}</td>
          <td>${rupiahFormat(x.price)}</td>
          <td><strong>${rupiahFormat(lineTotal)}</strong></td>
        </tr>
      `;
    });
  } else if (type === "mutations") {
    title = "LAPORAN BERKALA MUTASI BARANG RUANGAN";
    tableHeaders = "<th>No</th><th>Kode</th><th>Nama Barang</th><th>Unit</th><th>Ruang Asal</th><th>Ruang Tujuan</th><th>Waktu Mutasi</th><th>Petugas</th>";
    const mutations = getStoredMutations();
    mutations.forEach((x, idx) => {
      tableRows += `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td><code>${escapeHtml(x.itemCode)}</code></td>
          <td><strong>${escapeHtml(x.itemName)}</strong></td>
          <td style="text-align:center;">${x.qty} ${escapeHtml(x.unit)}</td>
          <td>${escapeHtml(x.fromRoom)}</td>
          <td>${escapeHtml(x.toRoom)}</td>
          <td>${escapeHtml(x.date)}</td>
          <td>${escapeHtml(x.by)}</td>
        </tr>
      `;
    });
  } else if (type === "services") {
    title = "REKAPITULASI PEMELIHARAAN & BIAYA SERVIS ASET";
    tableHeaders = "<th>No</th><th>Kode</th><th>Nama Barang</th><th>Lokasi</th><th>Status</th><th>Biaya Servis</th><th>Teknisi</th><th>Tanggal</th>";
    const services = getStoredServices();
    services.forEach((x, idx) => {
      totalFinancialValue += Number(x.cost || 0);
      tableRows += `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td><code>${escapeHtml(x.itemCode)}</code></td>
          <td><strong>${escapeHtml(x.itemName)}</strong></td>
          <td>${escapeHtml(x.room)}</td>
          <td>${escapeHtml(x.status)}</td>
          <td>${rupiahFormat(x.cost)}</td>
          <td>${escapeHtml(x.technician)}</td>
          <td>${escapeHtml(x.date)}</td>
        </tr>
      `;
    });
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Izin pop-up terblokir oleh browser.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>${title} - NusaTech</title>
        <style>
          @page { size: A4 portrait; margin: 15mm 12mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 10px; color: #0f172a; margin: 0; line-height: 1.35; font-size: 11px; }
          .kop { display: flex; align-items: center; justify-content: center; gap: 14px; border-bottom: 2.5px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; text-align: center; }
          .kop h2 { margin: 0; font-size: 17px; font-weight: 800; }
          .kop h4 { margin: 3px 0; font-size: 12px; font-weight: 700; color: #2563eb; }
          .kop p { margin: 0; font-size: 10px; color: #475569; }
          .title-section { text-align: center; margin-bottom: 12px; }
          .title-section h3 { margin: 0; font-size: 13px; text-transform: uppercase; font-weight: 800; }
          .meta-info { display: flex; justify-content: space-between; font-size: 10px; color: #475569; margin-bottom: 10px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 14px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; color: #0f172a; font-weight: 700; text-transform: uppercase; font-size: 9px; }
          tr { page-break-inside: avoid; }
          tr:nth-child(even) { background: #f8fafc; }
          code { font-family: Consolas, monospace; font-size: 9.5px; background: #e2e8f0; padding: 1px 4px; border-radius: 4px; }
          .summary-total { text-align: right; font-size: 11px; font-weight: 800; margin-bottom: 24px; padding: 6px 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; }
          .signature-box { display: flex; justify-content: space-between; margin-top: 30px; page-break-inside: avoid; font-size: 11px; }
          .sig-col { text-align: center; width: 200px; }
          .sig-line { margin-top: 55px; border-bottom: 1px solid #0f172a; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="kop">
          <div>
            <h2>PT NUSATECH DIGITAL INDONESIA</h2>
            <h4>SISTEM MANAJEMEN INVENTARIS & SARANA PRASARANA</h4>
            <p>Divisi Operasional & Infrastruktur IT • Axentra Management Platform</p>
          </div>
        </div>
        <div class="title-section"><h3>${title}</h3></div>
        <div class="meta-info">
          <span>Dicetak Pada: <strong>${dateFormatted}</strong></span>
          <span>Status: <strong>Dokumen Terverifikasi Sistem</strong></span>
        </div>
        <table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableRows}</tbody></table>
        ${totalFinancialValue > 0 ? `<div class="summary-total">Total Nilai Akumulasi: ${rupiahFormat(totalFinancialValue)}</div>` : ''}
        <div class="signature-box">
          <div class="sig-col">
            <p>Mengetahui,<br><strong>Asset Management Lead</strong></p>
            <div class="sig-line"></div>
            <p style="margin-top: 4px; font-size: 10px;">PT NusaTech Digital Indonesia</p>
          </div>
          <div class="sig-col">
            <p>Petugas Verifikasi Lapangan,<br><strong>Custodian Staff</strong></p>
            <div class="sig-line"></div>
            <p style="margin-top: 4px; font-size: 10px;">Axentra Custodian Team</p>
          </div>
        </div>
        <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); };<\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

const inputImportCsv = document.getElementById("inputImportCsv");
inputImportCsv?.addEventListener("change", function(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(event) {
    try {
      const csvText = event.target.result;
      const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) {
        alert("File CSV kosong atau tidak memiliki baris data!");
        return;
      }

      let currentItems = [...getStoredItems()];
      let importedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const row = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
        const clean = row.map(val => val.replace(/^"|"$/g, '').trim());

        const code = clean[0];
        const name = clean[1];
        if (!code || !name) continue;

        const category = clean[2] || "Hardware IT";
        const room = clean[3] || "Server Room";
        const condition = clean[4] || "Baik";
        const qty = parseInt(clean[5], 10) || 1;
        const unit = clean[6] || "Unit";
        const price = parseInt(clean[7], 10) || 0;
        const supplier = clean[8] || "-";
        const notes = clean[9] || "-";

        const existingIdx = currentItems.findIndex(x => (x.code || "").toLowerCase() === code.toLowerCase());
        const itemObj = {
          id: existingIdx >= 0 ? currentItems[existingIdx].id : "NST-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
          code: code,
          name: name,
          category: category,
          room: room,
          condition: condition,
          qty: qty,
          unit: unit,
          price: price,
          supplier: supplier,
          notes: notes,
          image: existingIdx >= 0 ? currentItems[existingIdx].image : ""
        };

        if (existingIdx >= 0) {
          currentItems[existingIdx] = itemObj;
        } else {
          currentItems.push(itemObj);
        }
        importedCount++;
      }

      await saveItemsData(currentItems);
      renderAllData();
      showToast(`Berhasil mengimpor ${importedCount} data aset!`);
    } catch (err) {
      alert("Terjadi kesalahan saat memproses file CSV: " + err.message);
    } finally {
      inputImportCsv.value = "";
    }
  };
  reader.readAsText(file, "UTF-8");
});

// ============================================================
// SCANNER QR KAMERA
// ============================================================
qaScan?.addEventListener("click", startFullscreenScanner);

btnExitScanner?.addEventListener("click", () => {
  stopFullscreenScanner();
  closeModalDirectly(fullscreenScanner);
});

async function startFullscreenScanner() {
  if (typeof Html5Qrcode === "undefined") {
    alert("Library Html5Qrcode belum termuat!");
    return;
  }

  openModalLayer(fullscreenScanner);

  if (html5QrScannerInstance) {
    try {
      await html5QrScannerInstance.stop();
      html5QrScannerInstance.clear();
    } catch (e) {}
    html5QrScannerInstance = null;
  }

  const viewport = document.getElementById("qrReaderViewport");
  if (viewport) viewport.innerHTML = "";

  html5QrScannerInstance = new Html5Qrcode("qrReaderViewport");

  try {
    await html5QrScannerInstance.start(
      { facingMode: "environment" },
      { fps: 15 },
      (decodedText) => {
        if (navigator.vibrate) navigator.vibrate(100);
        stopFullscreenScanner();
        closeModalDirectly(fullscreenScanner);

        let cleanCode = decodedText.trim();
        if (cleanCode.includes("code=")) {
          cleanCode = cleanCode.split("code=")[1].split("&")[0];
        } else if (cleanCode.includes("item=")) {
          cleanCode = cleanCode.split("item=")[1].split("&")[0];
        }
        cleanCode = decodeURIComponent(cleanCode).trim();

        const items = getStoredItems();
        const match = items.find(x => 
          (x.code && x.code.trim().toLowerCase() === cleanCode.toLowerCase()) ||
          (x.id && String(x.id).trim().toLowerCase() === cleanCode.toLowerCase())
        );

        if (match) {
          showToast(`Ditemukan: ${match.name}`);
          setTimeout(() => showItemQrModal(match.id), 300);
        } else {
          alert(`Kode terbaca: "${cleanCode}", tetapi belum ada di database.`);
        }
      },
      () => {}
    );
  } catch (err) {
    stopFullscreenScanner();
    closeModalDirectly(fullscreenScanner);
    alert("Kamera gagal dimulai: " + err);
  }
}

function stopFullscreenScanner() {
  if (html5QrScannerInstance) {
    try {
      html5QrScannerInstance.stop().then(() => {
        html5QrScannerInstance.clear();
        html5QrScannerInstance = null;
      }).catch(() => { html5QrScannerInstance = null; });
    } catch (e) {
      html5QrScannerInstance = null;
    }
  }

  const videoElem = document.querySelector("#qrReaderViewport video");
  if (videoElem && videoElem.srcObject) {
    const stream = videoElem.srcObject;
    stream.getTracks().forEach(track => track.stop());
    videoElem.srcObject = null;
  }
}

// ============================================================
// ONBOARDING & AUTH RESMI
// ============================================================
function updateSlide(index) {
  currentSlideIndex = index;
  slides.forEach((slide, i) => slide?.classList.toggle("active", i === index));
  dots.forEach((dot, i) => dot?.classList.toggle("active", i === index));

  if (!btnNextOnboarding) return;
  if (index === slides.length - 1) {
    btnNextOnboarding.innerHTML = '<span>Mulai Sekarang</span> <i class="fa-solid fa-check"></i>';
  } else {
    btnNextOnboarding.innerHTML = '<span>Lanjut</span> <i class="fa-solid fa-arrow-right"></i>';
  }
}

btnNextOnboarding?.addEventListener("click", () => {
  if (currentSlideIndex < slides.length - 1) {
    updateSlide(currentSlideIndex + 1);
  } else {
    localStorage.setItem(KEY_HAS_ONBOARDED, "true");
    showScreen("gate");
  }
});

btnSkipOnboarding?.addEventListener("click", () => {
  localStorage.setItem(KEY_HAS_ONBOARDED, "true");
  showScreen("gate");
});

function getRememberedAccounts() {
  try {
    return JSON.parse(localStorage.getItem(KEY_REMEMBERED_ACCOUNTS)) || [];
  } catch { return []; }
}

function saveRememberedAccount(account) {
  let list = getRememberedAccounts();
  list = list.filter(a => a.email !== account.email);
  list.unshift(account);
  localStorage.setItem(KEY_REMEMBERED_ACCOUNTS, JSON.stringify(list.slice(0, 5)));
}

function openAuthModal(mode) {
  currentAuthMode = mode;
  hideAlert();
  openModalLayer(authModal);

  if (mode === "login") {
    if (authTitle) authTitle.textContent = "Masuk Sistem";
    if (authSubtitle) authSubtitle.textContent = "Akses database cloud inventaris PT NusaTech";
    if (authSubmitText) authSubmitText.textContent = "Masuk Sekarang";
    if (authHeaderIcon) authHeaderIcon.className = "fa-solid fa-arrow-right-to-bracket";
    if (fieldUsername) fieldUsername.classList.add("hidden");
    if (inputUsername) inputUsername.required = false;
    if (authToggleText) authToggleText.textContent = "Belum punya akun?";
    if (btnSwitchAuthMode) btnSwitchAuthMode.textContent = "Daftar Akun Baru";
  } else {
    if (authTitle) authTitle.textContent = "Daftar Akun Baru";
    if (authSubtitle) authSubtitle.textContent = "Buat akun staf NusaTech untuk mulai mengelola aset";
    if (authSubmitText) authSubmitText.textContent = "Daftar & Masuk";
    if (authHeaderIcon) authHeaderIcon.className = "fa-solid fa-user-plus";
    if (fieldUsername) fieldUsername.classList.remove("hidden");
    if (inputUsername) inputUsername.required = true;
    if (authToggleText) authToggleText.textContent = "Sudah punya akun?";
    if (btnSwitchAuthMode) btnSwitchAuthMode.textContent = "Masuk di sini";
  }
}

btnSwitchAccount?.addEventListener("click", () => {
  const accounts = getRememberedAccounts();
  if (accounts.length === 0) {
    openAuthModal("login");
    return;
  }

  if (switchAccountsList) {
    switchAccountsList.innerHTML = accounts.map(acc => {
      const initial = (acc.fullName || "N").charAt(0).toUpperCase();
      const avatarHtml = acc.avatar ? `<img src="${acc.avatar}">` : `<span>${initial}</span>`;

      return `
        <div class="saved-acc-tile" onclick="selectAccountToSwitch('${escapeHtml(acc.email)}')">
          <div class="acc-tile-left">
            <div class="acc-tile-avatar">${avatarHtml}</div>
            <div class="acc-tile-meta">
              <strong>${escapeHtml(acc.fullName)}</strong>
              <small>${escapeHtml(acc.email)}</small>
            </div>
          </div>
          <i class="fa-solid fa-chevron-right" style="color:var(--text-muted); font-size:12px;"></i>
        </div>
      `;
    }).join("");
  }

  openModalLayer(switchAccountModal);
});

window.selectAccountToSwitch = async function(email) {
  const accounts = getRememberedAccounts();
  const target = accounts.find(a => a.email === email);
  if (!target) return;

  localStorage.setItem(KEY_SESSION_USER, JSON.stringify(target));
  closeModalDirectly(switchAccountModal);
  await fetchAllActiveData();
  renderUserProfileHeader();
  renderAllData();
  showToast(`Beralih ke akun: ${target.fullName}`);
};

btnAddNewAccountTrigger?.addEventListener("click", () => {
  closeModalDirectly(switchAccountModal);
  setTimeout(() => openAuthModal("register"), 200);
});

btnGateLogin?.addEventListener("click", () => openAuthModal("login"));
btnGateRegister?.addEventListener("click", () => openAuthModal("register"));
btnSwitchAuthMode?.addEventListener("click", () => openAuthModal(currentAuthMode === "login" ? "register" : "login"));

function showAlert(message, type = "error") {
  if (!authAlert) return;
  authAlert.textContent = message;
  authAlert.className = `auth-alert ${type}`;
  authAlert.classList.remove("hidden");
}

function hideAlert() {
  if (!authAlert) return;
  authAlert.classList.add("hidden");
  authAlert.textContent = "";
}

authForm?.addEventListener("submit", async e => {
  e.preventDefault();
  hideAlert();

  const email = inputEmail?.value.trim().toLowerCase() || "";
  const password = inputPassword?.value || "";

  if (password.length < 6) {
    showAlert("Kata sandi minimal 6 karakter!");
    return;
  }

  if (!supabaseClient || !navigator.onLine) {
    showAlert("Koneksi Supabase tidak tersedia. Gunakan Mode Tamu.");
    return;
  }

  const submitBtn = authForm.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Memproses...";
  }

  if (currentAuthMode === "register") {
    const fullName = inputUsername?.value.trim();
    if (!fullName) {
      showAlert("Username tidak boleh kosong!");
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Daftar & Masuk"; }
      return;
    }

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: "PT NusaTech Digital Indonesia"
          }
        }
      });

      if (error) { showAlert(error.message); return; }

      showAlert("Pendaftaran berhasil! Silakan masuk.", "success");
      setTimeout(() => openAuthModal("login"), 1000);
    } catch (err) {
      showAlert("Gagal mendaftar: " + err.message);
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Daftar & Masuk"; }
    }
  } else {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        showAlert("Email atau kata sandi tidak cocok!");
        return;
      }

      showAlert("Berhasil masuk!", "success");
      closeModalDirectly(authModal);
    } catch (err) {
      showAlert("Gagal login: " + err.message);
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Masuk Sekarang"; }
    }
  }
});

btnGoogleAuth?.addEventListener("click", async () => {
  if (!supabaseClient) {
    showToast("Koneksi Supabase belum siap!");
    return;
  }

  showToast("Mengarahkan ke Akun Google...");
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname
    }
  });

  if (error) showToast("Gagal: " + error.message);
});

btnGateGuest?.addEventListener("click", async () => {
  localStorage.setItem(KEY_SESSION_USER, JSON.stringify({
    fullName: "Tamu Eksplorasi",
    email: "tamu@nusatech.co.id",
    role: "Mode Tamu (Sementara)",
    avatar: "",
    isGuest: true
  }));
  await fetchAllActiveData();
  showScreen("app");
  showToast("Mode Tamu Aktif: Data sementara tidak disimpan ke Cloud");
});

function triggerLogoutModal() {
  openModalLayer(logoutConfirmModal);
}

btnLogout?.addEventListener("click", triggerLogoutModal);
btnSidebarLogout?.addEventListener("click", triggerLogoutModal);

btnExecuteLogout?.addEventListener("click", async () => {
  if (isGuestSession()) {
    localStorage.removeItem(KEY_GUEST_ITEMS);
    localStorage.removeItem(KEY_GUEST_MUTATIONS);
    localStorage.removeItem(KEY_GUEST_SERVICES);
  }

  if (supabaseClient && navigator.onLine) {
    try { await supabaseClient.auth.signOut(); } catch (e) {}
  }

  localStorage.removeItem(KEY_SESSION_USER);
  inMemoryItems = []; inMemoryMutations = []; inMemoryServices = [];

  closeModalDirectly(logoutConfirmModal);
  showScreen("gate");
  showToast("Berhasil keluar sesi");
});

btnSeedDefaultData?.addEventListener("click", () => {
  openModalLayer(resetConfirmModal);
});

btnCancelReset?.addEventListener("click", () => {
  closeModalDirectly(resetConfirmModal);
});

btnExecuteReset?.addEventListener("click", async () => {
  closeModalDirectly(resetConfirmModal);
  showToast("Mereset data lokal & cloud...");

  if (!isGuestSession() && navigator.onLine && supabaseClient) {
    try {
      await supabaseClient.from("mutations").delete().neq("id", "0");
      await supabaseClient.from("services").delete().neq("id", "0");
      await supabaseClient.from("items").delete().neq("id", "0");
    } catch (err) {}
  }

  inMemoryMutations = [];
  inMemoryServices = [];
  localStorage.setItem(KEY_LOCAL_MUTATIONS, JSON.stringify([]));
  localStorage.setItem(KEY_LOCAL_SERVICES, JSON.stringify([]));
  if (typeof KEY_AUDIT_LOGS !== "undefined") {
    localStorage.removeItem(KEY_AUDIT_LOGS);
  }

  await saveItemsData([...demoSimulationItems]);
  logActivity("create", "Sistem Di-reset", "Database dikembalikan ke data simulasi default NusaTech", "RESET");

  renderAllData();
  switchTabView("home");
  showToast("Data simulasi bawaan berhasil dimuat ulang!");
});

// ============================================================
// CETAK MASSAL LABEL QR (FORMAT A4)
// ============================================================
window.printBatchQrLabels = function() {
  const items = getStoredItems();
  if (!items || items.length === 0) {
    alert("Belum ada data barang untuk dicetak labelnya!");
    return;
  }

  showToast("Menyiapkan dokumen label QR...");

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Izin pop-up terblokir! Harap izinkan pop-up di browser Anda.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Cetak Label Stiker QR - PT NusaTech Digital Indonesia</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #ffffff; color: #0f172a; }
          .batch-header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 16px; }
          .batch-header h2 { font-size: 15px; font-weight: 800; text-transform: uppercase; }
          .batch-header p { font-size: 10px; color: #475569; }
          .labels-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .label-card { border: 1.5px dashed #94a3b8; border-radius: 10px; padding: 10px; display: flex; flex-direction: column; align-items: center; text-align: center; page-break-inside: avoid; background: #fff; }
          .brand-tag { font-size: 8.5px; font-weight: 800; color: #2563eb; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; }
          .item-name { font-size: 11px; font-weight: 800; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; margin-bottom: 6px; }
          .qr-canvas-box { width: 100px; height: 100px; margin: 4px auto; display: flex; align-items: center; justify-content: center; }
          .qr-canvas-box canvas, .qr-canvas-box img { width: 100% !important; height: 100% !important; }
          .item-code { font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 4px; font-family: monospace; }
          .item-meta { font-size: 9px; color: #64748b; margin-top: 2px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="batch-header">
          <h2>Lembar Stiker Label Fisik Inventaris</h2>
          <p>PT NusaTech Digital Indonesia • Total: ${items.length} Aset</p>
        </div>
        <div class="labels-grid" id="labelsContainer"></div>
        <script>
          const rawItems = ${JSON.stringify(items)};
          const container = document.getElementById("labelsContainer");

          rawItems.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "label-card";
            card.innerHTML = \`
              <span class="brand-tag">NusaTech • Axentra</span>
              <strong class="item-name" title="\${item.name}">\${item.name}</strong>
              <div class="qr-canvas-box" id="qr-box-\${index}"></div>
              <span class="item-code">\${item.code}</span>
              <span class="item-meta">\${item.room || '-'} • \${item.category || '-'}</span>
            \`;
            container.appendChild(card);

            new QRCode(document.getElementById("qr-box-" + index), {
              text: item.code,
              width: 100,
              height: 100,
              colorDark: "#0f172a",
              colorLight: "#ffffff",
              correctLevel: QRCode.CorrectLevel.H
            });
          });

          window.onload = function() { setTimeout(function() { window.print(); }, 600); };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// ============================================================
// PENGINGAT SERVIS JATUH TEMPO
// ============================================================
window.checkMaintenanceReminders = function() {
  const reminderCard = document.getElementById("serviceReminderAlert");
  const countText = document.getElementById("reminderCountText");
  const descText = document.getElementById("reminderDescText");
  const tagsContainer = document.getElementById("reminderItemsList");

  if (!reminderCard) return;

  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  const t = i18nDictionary[currentLang] || i18nDictionary.id;
  const items = getStoredItems();
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const dueItems = items.filter(it => {
    if (!it.nextService) return false;

    const parts = it.nextService.split("-");
    if (parts.length !== 3) return false;
    const targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getTime();

    const diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= -30;
  });

  if (dueItems.length === 0) {
    reminderCard.classList.add("hidden");
    return;
  }

  reminderCard.classList.remove("hidden");
  if (countText) {
    countText.textContent = (currentLang === "en")
      ? `${dueItems.length} Assets Need Service`
      : `${dueItems.length} Aset Perlu Diservis`;
  }
  if (descText) {
    descText.textContent = t.reminderDesc || "Ada unit yang jadwal servis berkala sudah tiba atau jatuh tempo dalam minggu ini.";
  }

  if (tagsContainer) {
    tagsContainer.innerHTML = "";
    dueItems.slice(0, 3).forEach(it => {
      const tag = document.createElement("span");
      tag.className = "reminder-tag";
      tag.textContent = `${it.name} (${it.code})`;
      tagsContainer.appendChild(tag);
    });

    if (dueItems.length > 3) {
      const moreTag = document.createElement("span");
      moreTag.className = "reminder-tag";
      moreTag.textContent = (currentLang === "en") ? `+${dueItems.length - 3} more` : `+${dueItems.length - 3} lainnya`;
      tagsContainer.appendChild(moreTag);
    }
  }
};

// ============================================================
// AUDIT TRAIL / LOG AKTIVITAS
// ============================================================
const KEY_AUDIT_LOGS = "inventaris_audit_logs";
const auditLogsModal = document.getElementById("auditLogsModal");
const btnViewAllLogs = document.getElementById("btnViewAllLogs");
const auditFeedFullList = document.getElementById("auditFeedFullList");
const inputSearchLogs = document.getElementById("inputSearchLogs");

function getStoredLogs() {
  try {
    return JSON.parse(localStorage.getItem(KEY_AUDIT_LOGS)) || [];
  } catch { return []; }
}

function saveAuditLogs(logs) {
  localStorage.setItem(KEY_AUDIT_LOGS, JSON.stringify(logs.slice(0, 150)));
}

window.logActivity = function(actionType, title, description, code = "") {
  const session = getCurrentUserSession();
  const userName = session ? (session.fullName || "Staf Staf") : "Staf NusaTech";
  
  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('id-ID', { month: 'short' })} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    type: actionType,
    user: userName,
    title: title,
    desc: description,
    code: code,
    timestamp: dateStr
  };

  const logs = getStoredLogs();
  logs.unshift(newLog);
  saveAuditLogs(logs);
};

function renderAuditLogsModal() {
  if (!auditFeedFullList) return;
  const currentLang = localStorage.getItem(KEY_LANGUAGE) || "id";
  const logs = getStoredLogs();
  const searchKeyword = (inputSearchLogs?.value || "").toLowerCase().trim();

  const filtered = logs.filter(l => 
    `${l.user} ${l.title} ${l.desc} ${l.code}`.toLowerCase().includes(searchKeyword)
  );

  if (filtered.length === 0) {
    const emptyLogMsg = (currentLang === "en")
      ? "No matching audit activity records found."
      : "Belum ada rekaman riwayat aktivitas yang sesuai.";
    auditFeedFullList.innerHTML = `
      <div style="text-align:center; padding: 30px 10px; color: var(--text-muted); font-size: 12px;">
        <i class="fa-solid fa-clock-rotate-left" style="font-size: 26px; margin-bottom: 8px; opacity: 0.5;"></i>
        <p>${emptyLogMsg}</p>
      </div>
    `;
    return;
  }

  const iconMap = {
    create: "fa-plus",
    edit: "fa-pen",
    delete: "fa-trash",
    mutate: "fa-arrow-right-arrow-left",
    service: "fa-screwdriver-wrench"
  };

  auditFeedFullList.innerHTML = filtered.map(item => `
    <div class="audit-log-item">
      <div class="audit-log-icon ${item.type}">
        <i class="fa-solid ${iconMap[item.type] || 'fa-bell'}"></i>
      </div>
      <div class="audit-log-details">
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.desc)}</p>
        <small><i class="fa-regular fa-user"></i> ${escapeHtml(item.user)} • <i class="fa-regular fa-clock"></i> ${escapeHtml(item.timestamp)}</small>
      </div>
    </div>
  `).join("");
}

btnViewAllLogs?.addEventListener("click", () => {
  if (inputSearchLogs) inputSearchLogs.value = "";
  renderAuditLogsModal();
  openModalLayer(auditLogsModal);
});

inputSearchLogs?.addEventListener("input", renderAuditLogsModal);

// ============================================================
// INISIALISASI UTAMA
// ============================================================
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAppFlow);
} else {
  initAppFlow();
}
