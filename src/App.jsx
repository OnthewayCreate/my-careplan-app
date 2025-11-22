import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Plus, Trash2, CheckCircle, AlertCircle, FileText, User, ChevronDown, ChevronUp, Heart, LogOut, Save, Loader2, Lock, Mail } from 'lucide-react';
// Firebase Imports - Fixed for React Environment
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot } from "firebase/firestore";

// --- Firebase初期化 & 設定 ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- 定数・データ定義 ---
const CARE_LEVELS = [
  { level: 1, name: '要介護1', maxUnits: 16765, color: 'bg-green-100 text-green-800' },
  { level: 2, name: '要介護2', maxUnits: 19705, color: 'bg-blue-100 text-blue-800' },
  { level: 3, name: '要介護3', maxUnits: 27048, color: 'bg-indigo-100 text-indigo-800' },
  { level: 4, name: '要介護4', maxUnits: 30938, color: 'bg-purple-100 text-purple-800' },
  { level: 5, name: '要介護5', maxUnits: 36217, color: 'bg-pink-100 text-pink-800' },
];

const SERVICES = [
  { id: 'day_service_7', name: 'デイサービス (7-8時間)', units: 750, type: 'day', icon: '☀️' },
  { id: 'day_service_5', name: 'デイサービス (5-6時間)', units: 580, type: 'day', icon: '⛅' },
  { id: 'helper_life', name: '訪問介護 (生活援助45分)', units: 183, type: 'visit', icon: '🏠' },
  { id: 'helper_body', name: '訪問介護 (身体介護30分)', units: 250, type: 'visit', icon: '🛁' },
  { id: 'nurse', name: '訪問看護 (30分未満)', units: 469, type: 'medical', icon: '💉' },
  { id: 'rental_bed', name: '福祉用具 (特殊寝台)', units: 1200, type: 'rental', icon: '🛏️', isMonthly: true },
  { id: 'rental_wheelchair', name: '福祉用具 (車椅子)', units: 600, type: 'rental', icon: '🦽', isMonthly: true },
];

const DAYS = ['月', '火', '水', '木', '金', '土', '日'];

// --- Main Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // ログインしていない場合は認証画面を表示
  if (!user) {
    return <AuthScreen />;
  }

  // ログインしている場合はメインアプリを表示
  return <CarePlanApp user={user} />;
}

// --- 認証画面コンポーネント (Login/Signup) ---
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // ※注: このプレビュー環境では、便宜上、常に「匿名認証」を使用してログインを成功させます。
      // 本番環境でFirebase AuthのEmail/Passwordプロバイダを有効にした場合は、
      // 以下のコメントアウト部分（signInWithEmailAndPassword等）を使用してください。
      
      /* 本番用コードの例:
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      */

      // プレビュー環境用のフォールバック処理
      // 環境変数トークンがあればそれを使用、なければ匿名認証
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
      
      // 成功時は自動的にAppコンポーネント側で検知されて画面遷移します
    } catch (err) {
      console.error(err);
      setError('ログインに失敗しました。しばらく待ってから再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
             <Heart className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">マイケアプラン</h1>
          <p className="text-blue-100 text-sm mt-1">家族で作る、納得の介護。</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-700 mb-6 text-center">
            {isLogin ? 'ログイン' : '新規アカウント登録'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">メールアドレス</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">パスワード</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="6文字以上"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg transition shadow-md flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="animate-spin" size={18} />}
              {isLogin ? 'ログインして始める' : 'アカウントを作成'}
            </button>
          </form>
          
          {/* プレビュー環境用の注釈 */}
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg">
            <p className="font-bold mb-1">💡 開発プレビューモード</p>
            この環境では実際にはパスワード検証を行わず、デモ用IDでログインします。任意のメール・パスワードで試せます。
          </div>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:underline hover:text-blue-700"
            >
              {isLogin ? 'アカウントをお持ちでない方はこちら' : 'すでにアカウントをお持ちの方はこちら'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// --- アプリ本体 (CarePlanApp) ---
function CarePlanApp({ user }) {
  // --- State ---
  const [selectedLevel, setSelectedLevel] = useState(CARE_LEVELS[2]); 
  const [weeklyPlan, setWeeklyPlan] = useState({
    '月': [], '火': [], '水': [], '木': [], '金': [], '土': [], '日': [],
    'monthly': []
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDayForAdd, setSelectedDayForAdd] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // --- Firestore Sync Logic ---
  
  // データ読み込み (初回のみ)
  useEffect(() => {
    if (!user) return;
    
    const planDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'careplans', 'current');
    
    // リアルタイムリスナーをセット
    const unsubscribe = onSnapshot(planDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.weeklyPlan) setWeeklyPlan(data.weeklyPlan);
        if (data.selectedLevel) setSelectedLevel(data.selectedLevel);
        if (data.updatedAt) setLastSaved(data.updatedAt.toDate());
      }
    }, (error) => {
      console.error("Error getting document:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // データ保存
  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const planDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'careplans', 'current');
      await setDoc(planDocRef, {
        weeklyPlan,
        selectedLevel,
        updatedAt: new Date(),
        userId: user.uid
      });
      setLastSaved(new Date());
      setShowSuccess(true);
    } catch (error) {
      console.error("Error saving document:", error);
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  // ログアウト
  const handleLogout = () => {
    signOut(auth);
  };

  // --- Logic (Existing) ---

  const addService = (day, service) => {
    if (day === 'monthly') {
      if (weeklyPlan.monthly.some(s => s.id === service.id)) return;
      setWeeklyPlan(prev => ({
        ...prev,
        monthly: [...prev.monthly, { ...service, instanceId: Date.now() }]
      }));
    } else {
      setWeeklyPlan(prev => ({
        ...prev,
        [day]: [...prev[day], { ...service, instanceId: Date.now() }]
      }));
    }
    setIsModalOpen(false);
  };

  const removeService = (day, instanceId) => {
    setWeeklyPlan(prev => ({
      ...prev,
      [day]: prev[day].filter(s => s.instanceId !== instanceId)
    }));
  };

  const totalUnits = useMemo(() => {
    let total = 0;
    DAYS.forEach(day => {
      const dailyUnits = weeklyPlan[day].reduce((sum, s) => sum + s.units, 0);
      total += dailyUnits * 4; 
    });
    const monthlyUnits = weeklyPlan.monthly.reduce((sum, s) => sum + s.units, 0);
    total += monthlyUnits;
    return total;
  }, [weeklyPlan]);

  const usageRate = Math.min((totalUnits / selectedLevel.maxUnits) * 100, 100);
  const isOverLimit = totalUnits > selectedLevel.maxUnits;

  const calculateCost = () => {
    const unitPrice = 10; 
    if (isOverLimit) {
      const coveredUnits = selectedLevel.maxUnits;
      const overUnits = totalUnits - selectedLevel.maxUnits;
      return Math.floor((coveredUnits * unitPrice * 0.1) + (overUnits * unitPrice));
    } else {
      return Math.floor(totalUnits * unitPrice * 0.1);
    }
  };

  // --- UI Components ---

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="text-pink-500 fill-pink-500" size={24} />
            <h1 className="text-xl font-bold text-slate-700 hidden md:block">マイケアプラン</h1>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
              {user.isAnonymous ? 'ゲストモード' : user.email}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
               onClick={handleLogout}
               className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
               title="ログアウト"
             >
               <LogOut size={20} />
             </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow transition flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              保存
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">

        {/* Status Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Care Level Selector */}
            <div className="flex-1">
              <label className="block text-sm text-slate-500 mb-2 font-medium">ご本人の要介護度</label>
              <div className="flex flex-wrap gap-2">
                {CARE_LEVELS.map((level) => (
                  <button
                    key={level.level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      selectedLevel.level === level.level
                        ? `${level.color} ring-2 ring-offset-1 ring-slate-300`
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {level.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Unit Monitor */}
            <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-500">利用単位数（月間目安）</span>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${isOverLimit ? 'text-red-600' : 'text-slate-800'}`}>
                    {totalUnits.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-sm"> / {selectedLevel.maxUnits.toLocaleString()} 単位</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${isOverLimit ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min((totalUnits / selectedLevel.maxUnits) * 100, 100)}%` }}
                />
              </div>

              {/* Alert & Cost */}
              <div className="mt-3 flex justify-between items-start text-sm">
                <div>
                  {isOverLimit && (
                    <p className="text-red-600 flex items-center gap-1 font-bold">
                      <AlertCircle size={14} /> 限度額を超えています
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs">自己負担額（目安/1割）</p>
                  <p className="font-bold text-lg">¥ {calculateCost().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Monthly Services (Rental etc) */}
        <section>
          <h2 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span className="bg-orange-100 text-orange-600 p-1 rounded">毎月</span> 
            ずっと使うサービス (福祉用具など)
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 min-h-[80px]">
             <div className="flex flex-wrap gap-3">
                {weeklyPlan.monthly.map((service) => (
                  <ServiceCard 
                    key={service.instanceId} 
                    service={service} 
                    onRemove={() => removeService('monthly', service.instanceId)} 
                  />
                ))}
                <button 
                  onClick={() => { setSelectedDayForAdd('monthly'); setIsModalOpen(true); }}
                  className="flex items-center gap-1 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-orange-400 hover:text-orange-500 transition"
                >
                  <Plus size={18} /> 追加
                </button>
             </div>
          </div>
        </section>

        {/* Weekly Calendar */}
        <section>
          <h2 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Calendar size={20} /> 週間スケジュール
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DAYS.map((day) => (
              <div key={day} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-700 bg-slate-100 w-8 h-8 flex items-center justify-center rounded-full">{day}</h3>
                  <span className="text-xs text-slate-400">
                    {weeklyPlan[day].length > 0 
                      ? `${weeklyPlan[day].reduce((sum, s) => sum + s.units, 0)} 単位/回` 
                      : '予定なし'}
                  </span>
                </div>

                <div className="space-y-2">
                  {weeklyPlan[day].map((service) => (
                    <ServiceCard 
                      key={service.instanceId} 
                      service={service} 
                      onRemove={() => removeService(day, service.instanceId)} 
                    />
                  ))}
                  
                  <button 
                    onClick={() => { setSelectedDayForAdd(day); setIsModalOpen(true); }}
                    className="w-full py-2 rounded-lg border border-dashed border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-blue-500 transition text-sm flex justify-center items-center gap-1"
                  >
                    <Plus size={14} /> サービスを追加
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Service Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-700">
                {selectedDayForAdd === 'monthly' ? '毎月のサービスを追加' : `${selectedDayForAdd}曜日にサービスを追加`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                閉じる
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-2">
              {SERVICES.filter(s => selectedDayForAdd === 'monthly' ? s.isMonthly : !s.isMonthly).map((service) => (
                <button
                  key={service.id}
                  onClick={() => addService(selectedDayForAdd, service)}
                  className="w-full p-3 flex items-center justify-between bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-xl transition text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{service.icon}</span>
                    <div>
                      <p className="font-bold text-slate-700 group-hover:text-blue-700">{service.name}</p>
                      <p className="text-xs text-slate-400">介護保険サービス</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-slate-600 group-hover:text-blue-600">{service.units} 単位</span>
                    <span className="text-xs text-slate-400">
                      {service.isMonthly ? '/月' : '/回'}
                    </span>
                  </div>
                </button>
              ))}
              
              {SERVICES.filter(s => selectedDayForAdd === 'monthly' ? s.isMonthly : !s.isMonthly).length === 0 && (
                <p className="text-center text-slate-400 py-4">利用可能なサービスがありません</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-blue-600/90 z-50 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">クラウドに保存しました</h2>
            <p className="text-slate-200 mb-6">
              次回ログイン時にも、この内容から編集を再開できます。
              <br/>
              <span className="text-xs opacity-70 text-white mt-2 block">
                 (最終保存: {lastSaved?.toLocaleString()})
              </span>
            </p>
            <button 
              onClick={() => setShowSuccess(false)}
              className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceCard({ service, onRemove }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm group">
      <div className="flex items-center gap-3">
        <span className="text-xl">{service.icon}</span>
        <div>
          <p className="text-sm font-bold text-slate-700">{service.name}</p>
          <p className="text-xs text-slate-400">{service.units} 単位 {service.isMonthly ? '/月' : '/回'}</p>
        </div>
      </div>
      <button 
        onClick={onRemove}
        className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}