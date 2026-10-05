# PRD: Yapı 2 - Yarı Otomatik Lokal SaaS Test Üretici (Öncelikli Geliştirme)

## 1. Proje Özeti
Bu proje, herhangi bir sunucu kurulumuna gerek kalmadan tarayıcı üzerinde (lokal SaaS mantığında) çalışan, öğretmenin 3-4 farklı PDF'i yükleyerek içinden manuel olarak (dikdörtgen çizerek) beğendiği soruları kırptığı ve bunları birleştirip yeni bir PDF Test ile Cevap Anahtarı PDF'i oluşturduğu bir araçtır.

## 2. Kullanıcı Profili ve Hedef Kitle
* **Ana Kullanıcı:** Kendi yaprak testini ve deneme sınavını hızlıca derlemek isteyen öğretmen (Yönetici).
* **İhtiyaç:** Karmaşık yapay zeka kurulumlarıyla uğraşmadan, görsel bir arayüzde PDF'ten istediği soruyu makasla keser gibi alıp dizgi yapmak.

## 3. Kullanıcı Akışı (User Flow)
1. **İçe Aktarma:** Kullanıcı sisteme 3-4 adet test/deneme PDF'i yükler. PDF'ler sayfalar halinde görsele (PNG/JPG) dönüştürülür.
2. **Kırpma ve Toplama:** Kullanıcı istediği PDF'in istediği sayfasını açar. Faresiyle bir sorunun etrafına dikdörtgen çizer. "Soruyu Ekle" butonuna basar.
3. **Cevap Anahtarı Girişi:** Soru sepete (sağ veya alt panele) eklenirken, bir popup ile "Bu sorunun cevabı nedir? (A,B,C,D)" diye sorulur veya test oluşturma aşamasında topluca girilir.
4. **Test Dizgisi (Layout):** Toplanan sorular "Test Hazırlama" ekranında görüntülenir. Kullanıcı sürükle bırak (drag & drop) ile soruların sırasını değiştirir. Testin başlığı (Örn: 8. Sınıf İngilizce Deneme 1) girilir.
5. **Dışa Aktarma (Export):**
   * **Test PDF:** Seçilen görseller A4 formatında (tek veya çift sütun) dizilir ve PDF olarak indirilir.
   * **Cevap Anahtarı PDF:** Girilen cevaplar şık bir tablo formatında ayrı bir PDF olarak indirilir. Yöneticinin basım yapması için hazır hale gelir.

## 4. Temel Özellikler (Core Features)
* **Tamamen Tarayıcı Tabanlı (Client-side):** İşlemlerin hızlı olması için PDF dönüştürme ve görsel kırpma işlemlerinin cihazda (tarayıcıda) yapılması.
* **Canvas / Kırpma Aracı:** `react-image-crop` benzeri bir yapı ile sezgisel dikdörtgen çizimi.
* **Soru Sepeti (Cart):** Seçilen soruların geçici olarak IndexedDB veya LocalStorage'da tutulması (sayfa yenilense de kaybolmaması).
* **PDF Üretimi (Generation):** `jsPDF` veya `@react-pdf/renderer` ile A4 boyutunda, MEB formatına benzer bir dizgi (Header, Ad-Soyad alanı ve sorular) oluşturulması.

## 5. Teknik Mimari (Tech Stack)
* **Frontend:** React (Vite tabanlı), TailwindCSS, TypeScript.
* **PDF Engine (Okuma):** `pdf.js` (Mozilla) - PDF sayfalarını tarayıcıda canvas'a çizdirip resim olarak almak için.
* **Kırpma Modülü:** `react-image-crop`
* **PDF Engine (Yazma):** `jsPDF` (Görselleri A4'e basmak çok daha kolaydır).
* **Veri Saklama:** `localForage` (IndexedDB) - Soruları ve test oturumunu tarayıcıda tutmak için. (İstenirse daha sonra Supabase entegre edilip bulut SaaS'a dönüştürülebilir).
