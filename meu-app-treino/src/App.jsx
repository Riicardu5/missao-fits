import React, { useState, useEffect } from 'react'
import { auth, provider, db } from './firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { 
  collection, addDoc, query, where, onSnapshot, 
  orderBy, doc, deleteDoc, updateDoc, getDocs, or 
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // BUSCA GLOBAL: Ciclos que eu criei OU ciclos onde sou o aluno
        const q = query(
          collection(db, "ciclos"), 
          or(where("userId", "==", currentUser.uid), where("alunoEmail", "==", currentUser.email)),
          orderBy("createdAt", "desc")
        );
        
        onSnapshot(q, (snapshot) => {
          setMeusCiclos(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        });
      }
    });
    return () => unsub();
  }, []);

  // ... (Efeitos de busca de treinos e exercícios continuam iguais aos anteriores)
  useEffect(() => {
    if (cicloSelecionado?.id) {
      const q = query(collection(db, "treinos"), where("cicloId", "==", cicloSelecionado.id), orderBy("createdAt", "asc"));
      onSnapshot(q, (snapshot) => setMeusTreinos(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
    }
  }, [cicloSelecionado?.id]);

  useEffect(() => {
    if (cicloSelecionado?.ultimoTreinoId) {
      const q = query(collection(db, "exercicios_treino"), where("treinoId", "==", cicloSelecionado.ultimoTreinoId));
      onSnapshot(q, (snapshot) => setExerciciosDoDia(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
    }
  }, [cicloSelecionado?.ultimoTreinoId]);

  useEffect(() => {
    if (treinoSelecionado) {
      const q = query(collection(db, "exercicios_treino"), where("treinoId", "==", treinoSelecionado.id));
      onSnapshot(q, (snapshot) => setExerciciosParaEditar(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
    }
  }, [treinoSelecionado?.id]);

  const concluirTreinoDodia = async () => {
    if (!cicloSelecionado || meusTreinos.length === 0) return;
    const index = meusTreinos.findIndex(t => t.id === cicloSelecionado.ultimoTreinoId);
    let prox = index + 1 >= meusTreinos.length ? 0 : index + 1;
    const proxT = meusTreinos[prox];
    await updateDoc(doc(db, "ciclos", cicloSelecionado.id), { ultimoTreinoId: proxT.id, ultimoTreinoNome: proxT.nome });
    exerciciosDoDia.forEach(ex => updateDoc(doc(db, "exercicios_treino", ex.id), { concluido: false }));
  };

  if (!user) return (
    <div style={styles.containerMobile}><div style={styles.contentCenter}>
      <h1>Missão Fits 💪</h1><button onClick={() => signInWithPopup(auth, provider)} style={styles.btnGoogle}>Entrar com Google</button>
    </div></div>
  );

  // TELA DE EDIÇÃO (ONDE O PERSONAL MONTA O TREINO)
  if (treinoSelecionado) return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <button onClick={() => setTreinoSelecionado(null)} style={styles.btnBack}>← Salvar</button>
        <h3 style={{margin:0}}>Editando: {treinoSelecionado.nome}</h3>
      </header>
      <main style={styles.main}>
        {exerciciosParaEditar.map(ex => (
          <div key={ex.id} style={styles.cardExecucao}>
            <div style={{display:'flex', alignItems:'center'}}>
              <img src={ex.foto} style={styles.exerciseImgSmall} alt=""/>
              <strong style={{flex:1, marginLeft:'10px'}}>{ex.nome}</strong>
              <button onClick={() => deleteDoc(doc(db, "exercicios_treino", ex.id))} style={{color:'red', border:'none', background:'none'}}>✕</button>
            </div>
            <div style={styles.rowInputs}>
              <input defaultValue={ex.series} onBlur={(e)=>updateDoc(doc(db, "exercicios_treino", ex.id), {series: e.target.value})} placeholder="Séries" style={styles.inputPequeno}/>
              <input defaultValue={ex.carga} onBlur={(e)=>updateDoc(doc(db, "exercicios_treino", ex.id), {carga: e.target.value})} placeholder="Peso" style={styles.inputPequeno}/>
            </div>
            <textarea defaultValue={ex.obs} onBlur={(e)=>updateDoc(doc(db, "exercicios_treino", ex.id), {obs: e.target.value})} placeholder="Dica técnica..." style={styles.textareaObs}/>
          </div>
        ))}
        <h4 style={styles.titleSection}>Adicionar Exercício</h4>
        <input placeholder="Procurar no banco..." value={busca} onChange={(e)=>setBusca(e.target.value)} style={styles.inputTreino}/>
        <div style={{marginTop:'10px', maxHeight:'250px', overflowY:'auto'}}>
          {bancoExercicios.filter(e => e.nome.toLowerCase().includes(busca.toLowerCase())).map(ex => (
            <div key={ex.id} style={styles.treinoCard} onClick={() => addDoc(collection(db, "exercicios_treino"), { treinoId: treinoSelecionado.id, userId: user.uid, nome: ex.nome, foto: ex.foto, series: '3', carga: '10', concluido: false })}>
               <img src={ex.foto} style={styles.exerciseImgSmall} alt=""/>
               <span style={{flex:1, marginLeft:'10px'}}>{ex.nome}</span>
               <button style={styles.btnAddSmall}>+</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  // TELA DO CICLO (EXECUÇÃO)
  if (cicloSelecionado) return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <button onClick={() => setCicloSelecionado(null)} style={styles.btnBack}>← Voltar</button>
        <h3 style={{margin:0}}>{cicloSelecionado.nome}</h3>
      </header>
      <main style={styles.main}>
        <div style={styles.cardTreinoDoDia}>
          <div style={{fontSize:'22px', fontWeight:'bold'}}>{cicloSelecionado.ultimoTreinoNome || "Crie um treino abaixo"}</div>
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
            {ex.obs && <p style={{fontSize:'12px', color:'#666', margin:'5px 0'}}>💡 {ex.obs}</p>}
            <div style={{display:'flex', gap:'10px', marginTop:'5px'}}>
              <small>Séries: <b>{ex.series}</b></small>
              <small>Peso: <b>{ex.carga}kg</b></small>
            </div>
          </div>
        ))}

        {/* SÓ MOSTRA EDIÇÃO SE EU FOR O DONO (PERSONAL) */}
        {cicloSelecionado.userId === user.uid && (
          <>
            <h4 style={styles.titleSection}>Gerenciar Treinos</h4>
            <div style={styles.addArea}>
              <input value={novoNome} onChange={(e)=>setNovoNome(e.target.value)} placeholder="Novo Treino (ex: Treino B)" style={styles.inputTreino}/>
              <button onClick={async ()=>{
                const docRef = await addDoc(collection(db,"treinos"), { nome: novoNome, cicloId: cicloSelecionado.id, userId: user.uid, createdAt: new Date() });
                if(!cicloSelecionado.ultimoTreinoId) await updateDoc(doc(db,"ciclos",cicloSelecionado.id), { ultimoTreinoId: docRef.id, ultimoTreinoNome: novoNome });
                setNovoNome('');
              }} style={styles.btnAdd}>+</button>
            </div>
            {meusTreinos.map(t => (
              <div key={t.id} style={styles.treinoCard} onClick={()=>setTreinoSelecionado(t)}>
                <span>{t.nome}</span>
                <button onClick={(e)=>{e.stopPropagation(); deleteDoc(doc(db,"treinos",t.id))}} style={{color:'red', border:'none', background:'none'}}>✕</button>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );

  // TELA INICIAL
  return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <span>Olá, {user.displayName?.split(' ')[0]}</span>
        <button onClick={() => signOut(auth)} style={styles.btnLogout}>Sair</button>
      </header>
      <main style={styles.main}>
        
        <div style={styles.cardPersonal}>
          <h4 style={{margin:0, color:'#1976d2'}}>Área do Personal</h4>
          <p style={{fontSize:'12px', color:'#666'}}>1. Digite o e-mail do aluno abaixo.<br/>2. Dê um nome ao objetivo e clique no +.</p>
          <input value={emailAluno} onChange={(e)=>setEmailAluno(e.target.value)} placeholder="emaildoaluno@gmail.com" style={{...styles.inputTreino, marginBottom:'10px', width:'100%', boxSizing:'border-box'}}/>
        </div>

        <h2>Objetivos e Alunos</h2>
        <div style={styles.addArea}>
          <input value={novoNome} onChange={(e)=>setNovoNome(e.target.value)} placeholder="Ex: Treino do João" style={styles.inputTreino}/>
          <button onClick={async () => {
            await addDoc(collection(db, "ciclos"), { 
              nome: novoNome, 
              userId: user.uid, 
              createdAt: new Date(), 
              ultimoTreinoNome: 'Nenhum', 
              alunoEmail: emailAluno.toLowerCase().trim() 
            });
            setNovoNome(''); setEmailAluno('');
          }} style={styles.btnAdd}>+</button>
        </div>

        {meusCiclos.map(c => (
          <div key={c.id} style={{...styles.treinoCard, borderLeft: c.userId !== user.uid ? '5px solid #10b981' : '5px solid #007bff'}} onClick={() => setCicloSelecionado(c)}>
            <div style={{ flex: 1 }}>
              <strong>{c.nome}</strong><br/>
              <small>{c.userId !== user.uid ? '⭐ Recebido do Personal' : `Aluno: ${c.alunoEmail || 'Eu'}`}</small>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

const styles = {
  containerMobile: { maxWidth: '430px', minHeight: '100vh', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#F8F9FA' },
  contentCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  btnGoogle: { padding: '12px 24px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '30px', fontWeight:'bold', cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#fff', borderBottom: '1px solid #EEE' },
  main: { padding: '20px' },
  cardPersonal: { backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '15px', marginBottom: '15px', border: '1px solid #bbdefb' },
  addArea: { display: 'flex', gap: '10px', marginBottom: '20px' },
  inputTreino: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #DDD', outline: 'none' },
  inputInline: { width: '40px', padding: '2px', border: 'none', borderBottom: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold' },
  btnAdd: { backgroundColor: '#007bff', color: 'white', border: 'none', width: '45px', borderRadius: '10px', fontSize: '20px' },
  treinoCard: { padding: '15px', backgroundColor: '#fff', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor:'pointer' },
  exerciseImgSmall: { width: '40px', height: '40px', borderRadius: '6px', objectFit:'cover' },
  btnAddSmall: { backgroundColor: '#28a745', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '50%' },
  btnBack: { border: 'none', background: 'none', color: '#007bff', fontWeight: 'bold' },
  cardExecucao: { padding: '15px', backgroundColor: '#fff', borderRadius: '15px', marginBottom: '10px', border: '1px solid #EEE' },
  rowInputs: { display: 'flex', gap: '8px', marginTop: '10px' },
  inputPequeno: { width: '100%', padding: '8px', border: '1px solid #eee', borderRadius: '6px', textAlign: 'center' },
  cardTreinoDoDia: { background: '#1e293b', color: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', textAlign: 'center' },
  btnConcluir: { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', marginTop: '15px', fontWeight: 'bold', width: '100%' },
  btnLogout: { color: 'red', border: 'none', background: 'none' },
  titleSection: { borderLeft: '4px solid #007bff', paddingLeft: '10px', margin: '25px 0 10px', fontWeight: 'bold' },
  textareaObs: { width: '100%', marginTop: '10px', padding: '8px', borderRadius: '6px', border: '1px solid #eee', fontSize: '13px', resize: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif' }
};

export default App;