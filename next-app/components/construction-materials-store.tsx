'use client';

import React, { useState } from 'react';

interface Product {
  id: number;
  name: string;
  category: string;
  spec: string;
  price: number;
  unit: string;
  stock: number;
  stockStatus: 'พร้อมส่ง' | 'เหลือน้อย';
}

interface QuoteItem {
  product: Product;
  quantity: number;
  note?: string;
}

export default function ConstructionMaterialsStore() {
  const shopName = 'ราชาวัสดุ สุรินทร์';
  const location = '126 หมู่ 4 บ้านบุทม ต.เมืองที อ.เมือง จ.สุรินทร์ 32000';

  const categories = [
    'ทั้งหมด',
    'ปูนและคอนกรีต',
    'เหล็กโครงสร้าง',
    'ไม้แบบและไม้แปรรูป',
    'หลังคาและผนัง',
    'สีและเคมีภัณฑ์',
    'ระบบประปา',
    'ระบบไฟฟ้า',
    'เครื่องมือช่าง',
  ];

  const [products] = useState<Product[]>([
    {
      id: 1,
      name: 'ปูนซีเมนต์ ตราลูกโลก',
      category: 'ปูนและคอนกรีต',
      spec: '50 กก. | มอก. 15',
      price: 178,
      unit: 'ถุง',
      stock: 1250,
      stockStatus: 'พร้อมส่ง',
    },
    {
      id: 2,
      name: 'เหล็กเส้นกลม DB16',
      category: 'เหล็กโครงสร้าง',
      spec: 'ยาว 12 ม. | มอก.',
      price: 285,
      unit: 'เส้น',
      stock: 480,
      stockStatus: 'พร้อมส่ง',
    },
    {
      id: 3,
      name: 'ไม้แบบสน 2"x4"x4ม.',
      category: 'ไม้แบบและไม้แปรรูป',
      spec: 'เกรด A',
      price: 145,
      unit: 'ท่อน',
      stock: 320,
      stockStatus: 'พร้อมส่ง',
    },
    {
      id: 4,
      name: 'เมทัลชีท หลังคา สีน้ำเงิน',
      category: 'หลังคาและผนัง',
      spec: 'หนา 0.35 มม. | ยาว 4 ม.',
      price: 185,
      unit: 'แผ่น',
      stock: 210,
      stockStatus: 'พร้อมส่ง',
    },
    {
      id: 5,
      name: 'สีรองพื้นปูน TOA',
      category: 'สีและเคมีภัณฑ์',
      spec: 'ถัง 5 แกลลอน',
      price: 1250,
      unit: 'ถัง',
      stock: 45,
      stockStatus: 'เหลือน้อย',
    },
    {
      id: 6,
      name: 'ท่อ PVC 4 นิ้ว (หนา)',
      category: 'ระบบประปา',
      spec: 'ยาว 4 ม. | มอก.',
      price: 168,
      unit: 'ท่อน',
      stock: 380,
      stockStatus: 'พร้อมส่ง',
    },
    {
      id: 7,
      name: 'สายไฟ VVF 2x2.5',
      category: 'ระบบไฟฟ้า',
      spec: 'ม้วน 100 ม. | มอก.',
      price: 1250,
      unit: 'ม้วน',
      stock: 28,
      stockStatus: 'เหลือน้อย',
    },
    {
      id: 8,
      name: 'ปูนกาว C2TE สำหรับกระเบื้อง',
      category: 'สีและเคมีภัณฑ์',
      spec: 'ถุง 20 กก.',
      price: 245,
      unit: 'ถุง',
      stock: 156,
      stockStatus: 'พร้อมส่ง',
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchTerm, setSearchTerm] = useState('');
  const [quoteList, setQuoteList] = useState<QuoteItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    quantity: 1,
    address: '',
    note: '',
  });

  const filteredProducts = products.filter((product) => {
    const matchCategory =
      selectedCategory === 'ทั้งหมด' || product.category === selectedCategory;
    const matchSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.spec.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const openQuoteModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({ name: '', phone: '', quantity: 1, address: '', note: '' });
    setIsModalOpen(true);
  };

  const submitQuote = () => {
    if (!selectedProduct) return;

    const newQuote: QuoteItem = {
      product: selectedProduct,
      quantity: formData.quantity,
      note: formData.note,
    };

    setQuoteList([...quoteList, newQuote]);
    setIsModalOpen(false);
    alert(
      `เพิ่ม "${selectedProduct.name}" จำนวน ${formData.quantity} ${selectedProduct.unit} ลงรายการขอราคาแล้ว`,
    );
  };

  const sendAllQuotes = () => {
    if (quoteList.length === 0) return;
    console.log('=== ข้อมูลขอใบเสนอราคา ===', quoteList);
    alert(
      `ส่งคำขอราคา ${quoteList.length} รายการเรียบร้อย! (ข้อมูลถูก log ไว้)\n\nต่อไปสามารถเชื่อม Line OA หรือ Supabase ได้`,
    );
    setQuoteList([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">{shopName}</h1>
            <p className="text-sm text-gray-500">{location}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => alert('ติดต่อ: ไลน์ @rajawasu หรือ โทร 08x-xxx-xxxx')}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
            >
              ติดต่อร้าน
            </button>
            {quoteList.length > 0 && (
              <button
                type="button"
                onClick={() => alert(`คุณมี ${quoteList.length} รายการในรายการขอราคา`)}
                className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
              >
                รายการขอราคา ({quoteList.length})
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-orange-600 to-orange-700 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="mb-3 text-4xl font-bold">
            วัสดุก่อสร้างคุณภาพ
            <br />
            ส่งตรงถึงหน้างาน
          </h2>
          <p className="text-xl opacity-90">
            สำหรับช่างและเจ้าของบ้านในสุรินทร์และใกล้เคียง • สต็อกพร้อม • ราคาโครงการ
          </p>
          <div className="mt-6 flex justify-center gap-4 text-sm">
            <div className="rounded-full bg-white/20 px-4 py-1">ส่งฟรีเมื่อซื้อเกิน 15,000 บาท</div>
            <div className="rounded-full bg-white/20 px-4 py-1">มีรถส่งถึงหน้างาน</div>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-6 max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-6 text-center shadow md:grid-cols-4">
          <div>
            <div className="text-3xl font-bold text-orange-600">{products.length}</div>
            <div className="text-sm text-gray-500">รายการสินค้า</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600">{categories.length - 1}</div>
            <div className="text-sm text-gray-500">หมวดหมู่</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">98%</div>
            <div className="text-sm text-gray-500">สต็อกพร้อมส่ง</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600">อัปเดต</div>
            <div className="text-sm text-gray-500">12 ก.ค. 2569</div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl px-4 pb-24">
        <div className="mb-6 flex flex-col gap-4 md:flex-row">
          <input
            type="text"
            placeholder="ค้นหาสินค้า เช่น ปูน, เหล็ก, เมทัลชีท..."
            className="flex-1 rounded-xl border px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-600 text-white'
                  : 'border bg-white hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-lg"
            >
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                <div className="text-6xl opacity-60">🧱</div>
              </div>

              <div className="p-5">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg leading-tight font-semibold">{product.name}</h3>
                    <p className="mt-0.5 text-sm text-gray-500">{product.spec}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs whitespace-nowrap ${
                      product.stockStatus === 'พร้อมส่ง'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {product.stockStatus}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-orange-600">฿{product.price}</span>
                  <span className="text-gray-500">/ {product.unit}</span>
                </div>

                <div className="mt-1 text-xs text-gray-500">
                  คงเหลือ {product.stock} {product.unit}
                </div>

                <button
                  type="button"
                  onClick={() => openQuoteModal(product)}
                  className="mt-4 w-full rounded-xl bg-orange-600 py-3 font-medium text-white transition-colors hover:bg-orange-700"
                >
                  ขอใบเสนอราคา
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-12 text-center text-gray-500">ไม่พบสินค้าที่ตรงกับการค้นหา</div>
        )}
      </div>

      {quoteList.length > 0 && (
        <div className="fixed right-6 bottom-6 z-50">
          <button
            type="button"
            onClick={sendAllQuotes}
            className="flex items-center gap-3 rounded-2xl bg-orange-600 px-6 py-3 text-white shadow-xl hover:bg-orange-700"
          >
            ส่งคำขอราคา {quoteList.length} รายการ
            <span className="rounded bg-white/20 px-2 py-0.5 text-xs">→</span>
          </button>
        </div>
      )}

      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6">
            <h3 className="mb-1 text-xl font-semibold">ขอใบเสนอราคา</h3>
            <p className="mb-4 font-medium text-orange-600">{selectedProduct.name}</p>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล"
                className="w-full rounded-xl border px-4 py-3"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                type="tel"
                placeholder="เบอร์โทรศัพท์"
                className="w-full rounded-xl border px-4 py-3"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="จำนวน"
                  className="flex-1 rounded-xl border px-4 py-3"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })
                  }
                />
                <div className="flex items-center rounded-xl border px-4 text-gray-500">
                  {selectedProduct.unit}
                </div>
              </div>
              <input
                type="text"
                placeholder="ที่อยู่หน้างาน (เพื่อส่งของ)"
                className="w-full rounded-xl border px-4 py-3"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <textarea
                placeholder="หมายเหตุเพิ่มเติม (เช่น ต้องการส่งวันไหน, มีรถบรรทุกหรือไม่)"
                className="h-20 w-full rounded-xl border px-4 py-3"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-xl border py-3"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={submitQuote}
                className="flex-1 rounded-xl bg-orange-600 py-3 font-medium text-white"
              >
                เพิ่มลงรายการขอราคา
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-16 border-t py-8 text-center text-sm text-gray-500">
        ราชาวัสดุ สุรินทร์ • วัสดุก่อสร้างคุณภาพจากสุรินทร์ • โหมดตัวอย่าง (ยังไม่ได้เชื่อม
        Supabase)
      </footer>
    </div>
  );
}
