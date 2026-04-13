import React, { useState, useEffect } from 'react'
import { auth, provider, db } from './firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { 
  collection, addDoc, query, where, onSnapshot, 
  doc, deleteDoc, updateDoc, or, getDocs
} from 'firebase/firestore'
import { bancoExercicios } from './bancoExercicios'

function App() {
  const [user, setUser] = useState(null);
  const [cicloSelecionado, setCicloSelecionado] = useState(null);
  const [treinoSelecionado, setTreinoSelecionado] = useState(null);
  const [emailAluno, setEmailAluno] = useState(""); 
  const [meusCiclos, setMeusCiclos] = useState([]);
  const [meusTreinos, setMeusTreinos] = useState([]);
  const [exerciciosDoDia, setExerciciosDoDia] = useState([]);
  const [exerciciosParaEditar, setExerciciosParaEditar] = useState([]);
  const [novoNome, setNovoNome] = useState('');
  const [busca, setBusca] = useState('');

  // 1. MONITOR DE LOGIN
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setMeusCiclos([]);
        setCicloSelecionado(null);
      }
    });
    return () => unsub();
  }, []);

  // 2. BUSCA CICLOS DO USUÁRIO
  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "ciclos"), 
        or(where("userId", "==", user.uid), where("alunoEmail", "==", user.email.toLowerCase()))
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const lista = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setMeusCiclos(lista);
      });
      return () => unsub();
    }
  }, [user]);

  // 3. BUSCA TREINOS DO CICLO SELECIONADO (CORRIGIDO)
  useEffect(() => {
    if (cicloSelecionado?.id) {
      const q = query(
        collection(db, "treinos"), 
        where("cicloId", "==", cicloSelecionado.id)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const lista = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        // Ordenação manual para evitar erro de índice do Firebase
        lista.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        setMeusTreinos(lista);
      });
      return () => unsub();
    } else {
      setMeusTreinos([]);
    }
  }, [cicloSelecionado]);

  // 4. BUSCA EXERCÍCIOS DO DIA (EXECUÇÃO)
  useEffect(() => {
    if (cicloSelecionado?.ultimoTreinoId) {
      const q = query(collection(db, "exercicios_treino"), where("treinoId", "==", cicloSelecionado.ultimoTreinoId));
      const unsub = onSnapshot(q, (snapshot) => {
        setExerciciosDoDia(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      });
      return () => unsub();
    } else {
      setExerciciosDoDia([]);
    }
  }, [cicloSelecionado?.ultimoTreinoId]);

  // 5. BUSCA EXERCÍCIOS PARA EDIÇÃO
  useEffect(() => {
    if (treinoSelecionado?.id) {
      const q = query(collection(db, "exercicios_treino"), where("treinoId", "==", treinoSelecionado.id));
      const unsub = onSnapshot(q, (snapshot) => {
        setExerciciosParaEditar(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      });
      return () => unsub();
    }
  }, [treinoSelecionado]);

  const atualizarExercicioGlobal = async (nomeExercicio, campo, valor) => {
    const q = query(collection(db, "exercicios_treino"), where("nome", "==", nomeExercicio));
    const snap = await getDocs(q);
    snap.forEach((d) => updateDoc(doc(db, "exercicios_treino", d.id), { [campo]: valor }));
  };

  const handleDeleteItem = async (colecao, id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm("Deseja excluir?")) {
      await deleteDoc(doc(db, colecao, id));
      if (treinoSelecionado?.id === id) setTreinoSelecionado(null);
    }
  };

  const concluirTreinoDodia = async () => {
    if (!cicloSelecionado || meusTreinos.length === 0) return;
    const indexAtual = meusTreinos.findIndex(t => t.id === cicloSelecionado.ultimoTreinoId);
    let proximoIndex = indexAtual + 1 >= meusTreinos.length ? 0 : indexAtual + 1;
    const proximoTreino = meusTreinos[proximoIndex];
    await updateDoc(doc(db, "ciclos", cicloSelecionado.id), { 
      ultimoTreinoId: proximoTreino.id, ultimoTreinoNome: proximoTreino.nome 
    });
    exerciciosDoDia.forEach(ex => updateDoc(doc(db, "exercicios_treino", ex.id), { concluido: false }));
  };

  if (!user) return (
    <div style={styles.containerMobile}><div style={styles.contentCenter}>
      <h1>Missão Fits 💪</h1><button onClick={() => signInWithPopup(auth, provider)} style={styles.btnGoogle}>Entrar com Google</button>
    </div></div>
  );

  // TELA 3: EDIÇÃO DE TREINO
  if (treinoSelecionado) return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <button onClick={() => setTreinoSelecionado(null)} style={styles.btnBack}>← Salvar</button>
        <h3 style={{margin:0}}>{treinoSelecionado.nome}</h3>
      </header>
      <main style={styles.main}>
        {exerciciosParaEditar.map(ex => (
          <div key={ex.id} style={styles.cardExecucao}>
            <div style={{display:'flex', alignItems:'center'}}>
              <img src={ex.foto} style={styles.exerciseImgSmall} alt=""/>
              <strong style={{flex:1, marginLeft:'10px'}}>{ex.nome}</strong>
              <button onClick={(e) => handleDeleteItem("exercicios_treino", ex.id, e)} style={{color:'red', border:'none', background:'none'}}>✕</button>
            </div>
          </div>
        ))}
        <h4 style={styles.titleSection}>Adicionar Exercício</h4>
        <input placeholder="Buscar..." value={busca} onChange={(e)=>setBusca(e.target.value)} style={styles.inputTreino}/>
        <div style={{marginTop:'10px', maxHeight:'300px', overflowY:'auto'}}>
          {bancoExercicios.filter(e => e.nome.toLowerCase().includes(busca.toLowerCase())).map(ex => (
            <div key={ex.id} style={styles.treinoCard} onClick={async () => {
              addDoc(collection(db, "exercicios_treino"), { 
                treinoId: treinoSelecionado.id, userId: user.uid, nome: ex.nome, 
                foto: ex.foto, series: "3", carga: "10", concluido: false, obs: "" 
              });
            }}>
               <span>{ex.nome}</span><button style={styles.btnAddSmall}>+</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  // TELA 2: LISTA DE TREINOS E EXECUÇÃO
  if (cicloSelecionado) return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <button onClick={() => setCicloSelecionado(null)} style={styles.btnBack}>← Voltar</button>
        <h3 style={{margin:0}}>{cicloSelecionado.nome}</h3>
      </header>
      <main style={styles.main}>
        <div style={styles.cardTreinoDoDia}>
          <div style={{fontSize:'18px'}}>{cicloSelecionado.ultimoTreinoNome || "Crie um treino abaixo"}</div>
          <button onClick={concluirTreinoDodia} style={styles.btnConcluir}>CONCLUIR TREINO ✓</button>
        </div>

        {exerciciosDoDia.map(ex => (
          <div key={ex.id} style={{...styles.cardExecucao, backgroundColor: ex.concluido ? '#e8f5e9' : '#fff'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <input type="checkbox" checked={ex.concluido || false} onChange={(e) => updateDoc(doc(db, "exercicios_treino", ex.id), { concluido: e.target.checked })} style={{width:'20px', height:'20px'}}/>
                <strong style={{textDecoration: ex.concluido ? 'line-through' : 'none'}}>{ex.nome}</strong>
              </div>
              <img src={ex.foto} style={styles.exerciseImgSmall} alt=""/>
            </div>
            <div style={styles.rowInputs}>
              <div style={{flex:1}}><label style={styles.labelInput}>Séries</label><input defaultValue={ex.series} onBlur={(e)=>atualizarExercicioGlobal(ex.nome, "series", e.target.value)} style={styles.inputPequeno}/></div>
              <div style={{flex:1}}><label style={styles.labelInput}>Peso (kg)</label><input defaultValue={ex.carga} onBlur={(e)=>atualizarExercicioGlobal(ex.nome, "carga", e.target.value)} style={styles.inputPequeno}/></div>
            </div>
          </div>
        ))}

        <h4 style={styles.titleSection}>Treinos do Ciclo</h4>
        <div style={styles.addArea}>
          <input value={novoNome} onChange={(e)=>setNovoNome(e.target.value)} placeholder="Ex: Treino A" style={styles.inputTreino}/>
          <button onClick={async () => {
            if (!novoNome) return;
            const docRef = await addDoc(collection(db, "treinos"), { 
              nome: novoNome, cicloId: cicloSelecionado.id, userId: user.uid, ordem: meusTreinos.length 
            });
            if (!cicloSelecionado.ultimoTreinoId) {
              await updateDoc(doc(db, "ciclos", cicloSelecionado.id), { ultimoTreinoId: docRef.id, ultimoTreinoNome: novoNome });
            }
            setNovoNome('');
          }} style={styles.btnAdd}>+</button>
        </div>
        
        <div style={{marginTop: '15px'}}>
          {meusTreinos.map((t) => (
            <div key={t.id} style={styles.treinoCard} onClick={() => setTreinoSelecionado(t)}>
              <span style={{flex:1, fontWeight:'bold'}}>{t.nome}</span>
              <button onClick={(e) => handleDeleteItem("treinos", t.id, e)} style={{color:'red', border:'none', background:'none'}}>✕</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  // TELA 1: LISTA DE CICLOS
  return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <span>Olá, {user.displayName?.split(' ')[0]}</span>
        <button onClick={() => signOut(auth)} style={styles.btnLogout}>Sair</button>
      </header>
      <main style={styles.main}>
        <div style={styles.cardPersonal}>
          <h4>Novo Ciclo</h4>
          <input value={emailAluno} onChange={(e)=>setEmailAluno(e.target.value)} placeholder="E-mail do Aluno" style={{...styles.inputTreino, width:'100%', marginBottom:'10px', boxSizing:'border-box'}}/>
          <div style={styles.addArea}>
            <input value={novoNome} onChange={(e)=>setNovoNome(e.target.value)} placeholder="Nome do Ciclo" style={styles.inputTreino}/>
            <button onClick={async () => {
              if(!novoNome) return;
              await addDoc(collection(db, "ciclos"), { 
                nome: novoNome, userId: user.uid, createdAt: new Date(), 
                alunoEmail: emailAluno.toLowerCase().trim(), status: emailAluno ? "pendente" : "aceito" 
              });
              setNovoNome(''); setEmailAluno('');
            }} style={styles.btnAdd}>+</button>
          </div>
        </div>

        <h2>Meus Ciclos</h2>
        {meusCiclos.map(c => (
          <div key={c.id} style={styles.treinoCard} onClick={() => setCicloSelecionado(c)}>
            <div style={{ flex: 1 }}><strong>{c.nome}</strong></div>
            <button onClick={(e) => handleDeleteItem("ciclos", c.id, e)} style={{ color: 'red', border: 'none', background: 'none' }}>✕</button>
          </div>
        ))}
      </main>
    </div>
  );
}

const styles = {
  containerMobile: { maxWidth: '430px', minHeight: '100vh', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#F8F9FA' },
  contentCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  btnGoogle: { padding: '12px 24px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '30px', fontWeight:'bold' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#fff', borderBottom: '1px solid #EEE' },
  main: { padding: '20px' },
  cardPersonal: { backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '15px', marginBottom: '15px' },
  addArea: { display: 'flex', gap: '10px' },
  inputTreino: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #DDD', outline: 'none' },
  btnAdd: { backgroundColor: '#007bff', color: 'white', border: 'none', width: '45px', borderRadius: '10px', fontSize: '24px' },
  treinoCard: { padding: '15px', backgroundColor: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor:'pointer' },
  exerciseImgSmall: { width: '40px', height: '40px', borderRadius: '8px', objectFit:'cover' },
  btnAddSmall: { backgroundColor: '#28a745', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '50%' },
  btnBack: { border: 'none', background: 'none', color: '#007bff', fontWeight: 'bold' },
  cardExecucao: { padding: '15px', backgroundColor: '#fff', borderRadius: '15px', marginBottom: '12px', border: '1px solid #EEE' },
  rowInputs: { display: 'flex', gap: '12px', marginTop: '10px' },
  labelInput: { fontSize: '11px', color: '#888', display: 'block' },
  inputPequeno: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold' },
  cardTreinoDoDia: { background: '#1e293b', color: 'white', padding: '15px', borderRadius: '15px', marginBottom: '20px', textAlign: 'center' },
  btnConcluir: { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', marginTop: '10px', fontWeight: 'bold', width: '100%' },
  btnLogout: { color: 'red', border: 'none', background: 'none' },
  titleSection: { borderLeft: '4px solid #007bff', paddingLeft: '10px', margin: '20px 0 10px', fontWeight: 'bold' }
};

export default App;