---
title: Secure Vault
emoji: 🔐
colorFrom: cyan
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# 🔐 Secure Vault | الخزنة الآمنة للمطورين

**Secure Vault** هو تطبيق ويب متطور وآمن للغاية مصمم للمطورين والشركات لتنظيم وتشفير وإدارة البيانات الحساسة مثل المفاتيح البرمجية (Credentials)، خوادم الويب (VPS & Servers)، عملاء الذكاء الاصطناعي (AI Agents)، والروابط الهامة، بالإضافة إلى دمج كامل ومباشر مع خدمات **Google Workspace** (Drive, Sheets, Gmail, Docs, Forms) وسحابة **Firebase Firestore**.

---

## 🚀 Hugging Face Spaces Setup & Deployment

لقد قمنا بتجهيز كافة الملفات ليعمل التطبيق بأعلى كفاءة على **Hugging Face Spaces** باستخدام تقنية **Docker** مع خادم **Nginx** خفيف الوزن ومُهيأ لتشغيل تطبيقات React أحادية الصفحة (SPA).

### 🛠️ الملفات التي تم إعدادها وتجهيزها:
1. **`README.md`**: يحتوي على كود التهيئة (YAML Frontmatter) الخاص بـ Hugging Face مع هذا الدليل الإرشادي.
2. **`Dockerfile`**: يقوم بتثبيت الاعتمادات، وبناء التطبيق (`npm run build`)، ووضعه في خادم Nginx عالي السرعة.
3. **`nginx.conf`**: يهيئ خادم الويب للعمل على منفذ `7860` (المنفذ الافتراضي لـ Hugging Face) ومعالجة التوجيه الداخلي (Routing) لـ React Router.
4. **`.github/workflows/hf-sync.yml`**: نظام أتمتة كامل (CI/CD) يربط GitHub بـ Hugging Face تلقائياً عند دفع أي تعديلات.

---

## 📋 خطوات الرفع والنشر خطوة بخطوة | Step-by-Step Guide

### 1️⃣ إنشاء مستودع على GitHub وعرض الكود
قم بإنشاء مستودع (Repository) جديد على حسابك في GitHub، ثم ارفع الملفات الحالية إليه باستخدام الأوامر التالية في جهازك:
```bash
git init
git add .
git commit -m "Initial commit - Prepare for Hugging Face Spaces"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

### 2️⃣ إنشاء Space على Hugging Face
1. اذهب إلى [Hugging Face Spaces](https://huggingface.co/spaces).
2. اضغط على **Create new Space**.
3. أدخل اسم الـ Space (مثال: `secure-vault`).
4. اختر نوع الـ SDK ليكون **Docker**.
5. من خيارات الـ Docker Template، اختر **Blank**.
6. اختر الرؤية (Public أو Private) حسب رغبتك، ثم اضغط على **Create Space**.

---

### 3️⃣ ضبط مفاتيح الأمان على GitHub للرفع التلقائي (الخيار الموصى به)
لتحديث موقعك على Hugging Face تلقائياً كلما قمت برفع كود جديد على جيت هب:

1. اذهب إلى حسابك في Hugging Face ثم إلى [Settings -> Access Tokens](https://huggingface.co/settings/tokens).
2. قم بإنشاء Token جديد من نوع **Write** وانسخه.
3. اذهب إلى مستودع الكود الخاص بك على **GitHub**.
4. اضغط على **Settings** -> **Secrets and variables** -> **Actions**.
5. اضغط على **New repository secret**.
6. اكتب في الاسم: `HF_TOKEN`.
7. ضع الـ Token الذي نسخته من Hugging Face في خانة القيمة، ثم اضغط **Add secret**.

> **ملاحظة:** تأكد من فتح ملف `.github/workflows/hf-sync.yml` وتعديل القيم التالية لتطابق اسم حسابك واسم الـ Space الخاص بك:
> - `HF_USERNAME`: اسم حسابك في Hugging Face.
> - `HF_SPACE_NAME`: اسم الـ Space الذي قمت بإنشائه.

---

## 🔒 تهيئة Firebase و Google Auth على Hugging Face

يعتمد التطبيق على **Firebase** للنسخ الاحتياطي و **Google OAuth** للربط مع Workspace. لكي تعمل هذه الخدمات على الرابط الجديد لـ Hugging Face:

1. **إضافة النطاق المعتمد (Authorized Domains):**
   - اذهب إلى لوحة تحكم **Firebase Console** الخاصة بمشروعك.
   - اضغط على **Authentication** -> **Settings** -> **Authorized Domains**.
   - اضغط على **Add domain** وأضف رابط الـ Space الخاص بك (مثال: `your_username-secure-vault.hf.space`).

2. **إضافة روابط توجيه الـ OAuth في Google Cloud Console:**
   - اذهب إلى [Google Cloud Console OAuth consent screen](https://console.cloud.google.com/apis/credentials).
   - اختر مشروعك، ثم اضغط على تعديل ملف تعريف الـ Client ID الخاص بك (**OAuth 2.0 Client IDs**).
   - تحت **Authorized JavaScript origins**، أضف رابط الـ Space الخاص بك بدون المسارات (مثال: `https://your_username-secure-vault.hf.space`).
   - تحت **Authorized redirect URIs**، تأكد من إضافة رابط الـ Firebase Authentication Redirect المعتمد لديك وهو مُهيأ مسبقاً في Firebase.

---

## 🌍 English Quickstart Guide

This space is pre-configured to run flawlessly on **Hugging Face Spaces** using **Docker & Nginx** on port `7860`.

### Setup steps:
1. Create a **GitHub Repository** and push all files to it.
2. Create a **Hugging Face Space**, choosing **Docker** as the SDK and **Blank** as the template.
3. Create a Hugging Face Access Token with **Write** permissions.
4. Add that token to your **GitHub Repository Secrets** as `HF_TOKEN`.
5. Customize `HF_USERNAME` and `HF_SPACE_NAME` inside `.github/workflows/hf-sync.yml` to match your Hugging Face credentials.
6. Once pushed, GitHub Actions will build and deploy your React Secure Vault application directly onto Hugging Face Spaces!
7. Remember to add your Hugging Face space domain (`*.hf.space`) to the **Firebase Authentication Authorized Domains** to enable Google Cloud and Firebase Backup features on your deployed app.

---
🔐 **Secure Vault Team** | تم التطوير بحب وإتقان لتوفير بيئة عمل آمنة ومنظمة وممتازة.
