import React, { useState, useEffect } from 'react'
import { auth, provider, db } from './firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { 
  collection, addDoc, query, where, onSnapshot, 
  orderBy, doc, deleteDoc, updateDoc 
} from 'firebase/firestore'
import { bancoExercicios } from './bancoExercicios'

function App() {
  const [user, setUser] = useState(null);
  const [cicloSelecionado, setCicloSelecionado] = useState(null);
  const [treinoSelecionado, setTreinoSelecionado] = useState(null);
  
  const [meusCiclos, setMeusCiclos] = useState([]);
  const [meusTreinos, setMeusTreinos] = useState([]);
  const [exerciciosDoDia, setExerciciosDoDia] = useState([]);
  const [exerciciosParaEditar, setExerciciosParaEditar] = useState([]);
  
  const [novoNome, setNovoNome] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const q = query(collection(db, "ciclos"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        onSnapshot(q, (snapshot) => {
          const lista = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setMeusCiclos(lista);
        });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (cicloSelecionado) {
      const q = query(collection(db, "treinos"), where("cicloid", "==", cicloSelecionado.id), orderBy("createdAt", "asc"));
      const unsubT = onSnapshot(q, (snapshot) => {
        setMeusTreinos(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      });
      return () => unsubT();
    }
  }, [cicloSelecionado?.id]);

  useEffect(() => {
    if (cicloSelecionado?.ultimoTreinoId) {
      const q = query(collection(db, "exercicios_treino"), where("treinoId", "==", cicloSelecionado.ultimoTreinoId));
      onSnapshot(q, (snapshot) => {
        setExerciciosDoDia(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      });
    } else {
      setExerciciosDoDia([]);
    }
  }, [cicloSelecionado?.ultimoTreinoId]);

  useEffect(() => {
    if (treinoSelecionado) {
      const q = query(collection(db, "exercicios_treino"), where("treinoId", "==", treinoSelecionado.id));
      onSnapshot(q, (snapshot) => {
        setExerciciosParaEditar(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      });
    }
  }, [treinoSelecionado]);

  const concluirTreinoDodia = async () => {
    if (!cicloSelecionado || meusTreinos.length === 0) return;
    const index = meusTreinos.findIndex(t => t.id === cicloSelecionado.ultimoTreinoId);
    let prox = index + 1 >= meusTreinos.length ? 0 : index + 1;
    const proxT = meusTreinos[prox];
    await updateDoc(doc(db, "ciclos", cicloSelecionado.id), {
      ultimoTreinoId: proxT.id,
      ultimoTreinoNome: proxT.nome
    });
  };

  const deletarItem = async (col, id) => {
    if(window.confirm("Excluir definitivamente?")) {
      // PREVENÇÃO DO BUG: Limpa os estados antes de deletar no banco
      if (col === "ciclos") setCicloSelecionado(null);
      if (col === "treinos") setTreinoSelecionado(null);
      
      try {
        await deleteDoc(doc(db, col, id));
      } catch (err) {
        console.error("Erro ao deletar:", err);
      }
    }
  };

  if (!user) return (
    <div style={styles.containerMobile}><div style={styles.contentCenter}>
      <h1>Missão Fits 💪</h1><button onClick={() => signInWithPopup(auth, provider)} style={styles.btnGoogle}>Entrar com Google</button>
    </div></div>
  );

  if (treinoSelecionado) return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <button onClick={() => setTreinoSelecionado(null)} style={styles.btnBack}>← Salvar</button>
        <h3 style={{margin:0}}>Editar: {treinoSelecionado.nome}</h3>
      </header>
      <main style={styles.main}>
        {exerciciosParaEditar.map(ex => (
          <div key={ex.id} style={styles.cardExecucao}>
            <div style={{display:'flex', alignItems:'center'}}>
              <img src={ex.foto} style={styles.exerciseImgSmall} alt=""/>
              <strong style={{flex:1, marginLeft:'10px'}}>{ex.nome}</strong>
              <button onClick={() => deletarItem("exercicios_treino", ex.id)} style={{color:'red', border:'none', background:'none'}}>✕</button>
            </div>
            <div style={styles.rowInputs}>
              <input defaultValue={ex.series} onBlur={(e)=>updateDoc(doc(db, "exercicios_treino", ex.id), {series: e.target.value})} placeholder="Séries" style={styles.inputPequeno}/>
              <input defaultValue={ex.carga} onBlur={(e)=>updateDoc(doc(db, "exercicios_treino", ex.id), {carga: e.target.value})} placeholder="Carga" style={styles.inputPequeno}/>
            </div>
          </div>
        ))}
        <h4 style={styles.titleSection}>Adicionar</h4>
        <input placeholder="Buscar..." value={busca} onChange={(e)=>setBusca(e.target.value)} style={styles.inputTreino}/>
        <div style={{marginTop:'15px', maxHeight:'300px', overflowY:'auto'}}>
          {bancoExercicios.filter(e => e.nome.toLowerCase().includes(busca.toLowerCase())).map(ex => (
            <div key={ex.id} style={styles.treinoCard}>
              <img src={ex.foto} style={styles.exerciseImg} alt=""/>
              <div style={{flex:1, marginLeft:'10px'}}><small>{ex.nome}</small></div>
              <button onClick={()=>addDoc(collection(db, "exercicios_treino"), {treinoId: treinoSelecionado.id, nome: ex.nome, foto: ex.foto, series:'', carga:'', anotacao:''})} style={styles.btnAddSmall}>+</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  if (cicloSelecionado) return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <button onClick={() => setCicloSelecionado(null)} style={styles.btnBack}>← Ciclos</button>
        <h3 style={{margin:0}}>{cicloSelecionado.nome}</h3>
      </header>
      <main style={styles.main}>
        <div style={styles.cardTreinoDoDia}>
          <small>TREINO DE HOJE</small>
          <div style={{fontSize:'22px', fontWeight:'bold'}}>{cicloSelecionado.ultimoTreinoNome || "Crie um treino"}</div>
          <button onClick={concluirTreinoDodia} style={styles.btnConcluir}>MARCAR COMO FEITO ✓</button>
        </div>
        {exerciciosDoDia.map(ex => (
          <div key={ex.id} style={styles.cardExecucao}>
            <div style={{display:'flex', alignItems:'center'}}>
              <img src={ex.foto} style={styles.exerciseImgSmall} alt=""/>
              <div style={{marginLeft:'10px'}}>
                <strong>{ex.nome}</strong><br/>
                <small style={{color:'#007bff'}}>{ex.series} • {ex.carga}</small>
              </div>
            </div>
          </div>
        ))}
        <h4 style={styles.titleSection}>Gerenciar Treinos</h4>
        <div style={styles.addArea}>
          <input value={novoNome} onChange={(e)=>setNovoNome(e.target.value)} placeholder="Novo Treino" style={styles.inputTreino}/>
          <button onClick={async ()=>{
            if(!novoNome) return;
            const docRef = await addDoc(collection(db,"treinos"), {nome:novoNome, cicloId:cicloSelecionado.id, userId:user.uid, createdAt:new Date()});
            if(!cicloSelecionado.ultimoTreinoId) await updateDoc(doc(db,"ciclos",cicloSelecionado.id), {ultimoTreinoId:docRef.id, ultimoTreinoNome:novoNome});
            setNovoNome('');
          }} style={styles.btnAdd}>+</button>
        </div>
        {meusTreinos.map(t => (
          <div key={t.id} style={styles.treinoCard} onClick={()=>setTreinoSelecionado(t)}>
            <strong>{t.nome}</strong>
            <button onClick={(e)=>{e.stopPropagation(); deletarItem("treinos", t.id)}} style={{color:'red', border:'none', background:'none', padding:'10px'}}>✕</button>
          </div>
        ))}
      </main>
    </div>
  );

  return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <span>Olá, {user.displayName?.split(' ')[0]}</span>
        <button onClick={() => signOut(auth)} style={styles.btnLogout}>Sair</button>
      </header>
      <main style={styles.main}>
        <h2>Meus Ciclos</h2>
        <div style={styles.addArea}>
          <input value={novoNome} onChange={(e)=>setNovoNome(e.target.value)} placeholder="Ex: Bulking" style={styles.inputTreino}/>
          <button onClick={async () => {
            if(!novoNome) return;
            await addDoc(collection(db, "ciclos"), { nome: novoNome, userId: user.uid, createdAt: new Date(), ultimoTreinoNome: 'Nenhum' });
            setNovoNome('');
          }} style={styles.btnAdd}>+</button>
        </div>
        {meusCiclos.map(c => (
          <div key={c.id} style={styles.treinoCard} onClick={() => setCicloSelecionado(c)}>
            <div style={{ flex: 1 }}>
              <strong>{c.nome}</strong><br/>
              <small style={{ color: '#666' }}>Próximo: {c.ultimoTreinoNome}</small>
            </div>
            <button onClick={(e) => { e.stopPropagation(); deletarItem("ciclos", c.id); }} style={{ color: '#ff4444', border: 'none', background: 'none', padding: '10px', fontSize: '18px' }}>✕</button>
          </div>
        ))}
      </main>
    </div>
  );
}

const styles = {
  containerMobile: { maxWidth: '430px', minHeight: '100vh', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#F8F9FA', display: 'flex', flexDirection: 'column' },
  contentCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 },
  btnGoogle: { padding: '12px 24px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '30px', fontWeight:'bold' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#fff', borderBottom: '1px solid #EEE' },
  main: { flex: 1, padding: '20px' },
  addArea: { display: 'flex', gap: '10px', marginBottom: '20px' },
  inputTreino: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #DDD' },
  btnAdd: { backgroundColor: '#007bff', color: 'white', border: 'none', width: '45px', borderRadius: '10px', fontSize: '20px' },
  treinoCard: { padding: '15px', backgroundColor: '#fff', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  exerciseImg: { width: '50px', height: '50px', borderRadius: '8px', objectFit:'cover' },
  btnAddSmall: { backgroundColor: '#28a745', color: 'white', border: 'none', width: '35px', height: '35px', borderRadius: '50%' },
  btnBack: { border: 'none', background: 'none', color: '#007bff', fontWeight: 'bold' },
  cardExecucao: { padding: '12px', backgroundColor: '#fff', borderRadius: '12px', marginBottom: '10px', border: '1px solid #EEE' },
  exerciseImgSmall: { width: '50px', height: '50px', borderRadius: '6px', objectFit:'cover' },
  rowInputs: { display: 'flex', gap: '8px', marginTop: '10px' },
  inputPequeno: { width: '100%', padding: '8px', border: '1px solid #eee', borderRadius: '6px', textAlign: 'center', fontSize: '14px' },
  cardTreinoDoDia: { background: '#1e293b', color: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', textAlign: 'center' },
  btnConcluir: { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', marginTop: '15px', fontWeight: 'bold', width: '100%' },
  btnLogout: { color: 'red', border: 'none', background: 'none' },
  titleSection: { borderLeft: '4px solid #007bff', paddingLeft: '10px', margin: '25px 0 10px', fontWeight: 'bold' }
};

export default App;