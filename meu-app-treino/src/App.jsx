import React, { useState, useEffect } from 'react'
import { auth, provider, db } from './firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { 
  collection, addDoc, query, where, onSnapshot, 
  doc, deleteDoc, updateDoc, or, getDocs, orderBy 
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
      if (!currentUser) setMeusCiclos([]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "ciclos"), 
        or(where("userId", "==", user.uid), where("alunoEmail", "==", user.email.toLowerCase()))
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const lista = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        lista.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setMeusCiclos(lista);
      });
      return () => unsub();
    }
  }, [user]);

  useEffect(() => {
    if (cicloSelecionado?.id) {
      const q = query(collection(db, "treinos"), where("cicloId", "==", cicloSelecionado.id), orderBy("ordem", "asc"));
      const unsub = onSnapshot(q, (snapshot) => {
        setMeusTreinos(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      });
      return () => unsub();
    }
  }, [cicloSelecionado?.id]);

  useEffect(() => {
    if (cicloSelecionado?.ultimoTreinoId) {
      const q = query(collection(db, "exercicios_treino"), where("treinoId", "==", cicloSelecionado.ultimoTreinoId));
      onSnapshot(q, (snapshot) => setExerciciosDoDia(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
    }
  }, [cicloSelecionado?.ultimoTreinoId]);

  useEffect(() => {
    if (treinoSelecionado?.id) {
      const q = query(collection(db, "exercicios_treino"), where("treinoId", "==", treinoSelecionado.id));
      onSnapshot(q, (snapshot) => setExerciciosParaEditar(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
    }
  }, [treinoSelecionado?.id]);

  const atualizarExercicioGlobal = async (nomeExercicio, campo, valor) => {
    const q = query(collection(db, "exercicios_treino"), where("nome", "==", nomeExercicio));
    const snap = await getDocs(q);
    snap.forEach((d) => updateDoc(doc(db, "exercicios_treino", d.id), { [campo]: valor }));
  };

  const moverTreino = async (index, direcao) => {
    const novoIndex = index + direcao;
    if (novoIndex < 0 || novoIndex >= meusTreinos.length) return;
    const itemAtual = meusTreinos[index];
    const itemTroca = meusTreinos[novoIndex];
    await updateDoc(doc(db, "treinos", itemAtual.id), { ordem: itemTroca.ordem });
    await updateDoc(doc(db, "treinos", itemTroca.id), { ordem: itemAtual.ordem });
  };

  const handleDeleteItem = async (colecao, id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm("Deseja excluir permanentemente?")) {
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

  // TELA DE EDIÇÃO DE UM TREINO ESPECÍFICO
  if (treinoSelecionado) return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <button onClick={() => setTreinoSelecionado(null)} style={styles.btnBack}>← Salvar</button>
        <input 
          defaultValue={treinoSelecionado.nome} 
          onBlur={(e) => {
            updateDoc(doc(db, "treinos", treinoSelecionado.id), { nome: e.target.value });
            if(cicloSelecionado.ultimoTreinoId === treinoSelecionado.id) {
               updateDoc(doc(db, "ciclos", cicloSelecionado.id), { ultimoTreinoNome: e.target.value });
            }
          }}
          style={styles.inputHeaderInvisible}
        />
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
        <input placeholder="Buscar no banco..." value={busca} onChange={(e)=>setBusca(e.target.value)} style={styles.inputTreino}/>
        <div style={{marginTop:'10px', maxHeight:'300px', overflowY:'auto'}}>
          {bancoExercicios.filter(e => e.nome.toLowerCase().includes(busca.toLowerCase())).map(ex => (
            <div key={ex.id} style={styles.treinoCard} onClick={async () => {
              const q = query(collection(db, "exercicios_treino"), where("nome", "==", ex.nome));
              const snap = await getDocs(q);
              const data = snap.empty ? {carga:'10', series:'3'} : snap.docs[0].data();
              addDoc(collection(db, "exercicios_treino"), { 
                treinoId: treinoSelecionado.id, userId: user.uid, nome: ex.nome, 
                foto: ex.foto, series: data.series, carga: data.carga, concluido: false, obs: "" 
              });
            }}>
               <span>{ex.nome}</span><button style={styles.btnAddSmall}>+</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  // TELA DO CICLO SELECIONADO (ONDE MOSTRA O TREINO DO DIA E A LISTA DE TREINOS)
  if (cicloSelecionado) return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <button onClick={() => setCicloSelecionado(null)} style={styles.btnBack}>← Voltar</button>
        <h3 style={{margin:0}}>{cicloSelecionado.nome}</h3>
      </header>
      <main style={styles.main}>
        <div style={styles.cardTreinoDoDia}>
          <div style={{fontSize:'20px', fontWeight:'bold'}}>{cicloSelecionado.ultimoTreinoNome || "Crie um treino abaixo"}</div>
          <button onClick={concluirTreinoDodia} style={styles.btnConcluir}>CONCLUIR TREINO ✓</button>
        </div>

        {exerciciosDoDia.map(ex => (
          <div key={ex.id} style={{...styles.cardExecucao, backgroundColor: ex.concluido ? '#e8f5e9' : '#fff'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <input type="checkbox" checked={ex.concluido || false} onChange={(e) => updateDoc(doc(db, "exercicios_treino", ex.id), { concluido: e.target.checked })} style={{width:'22px', height:'22px'}}/>
                <strong style={{textDecoration: ex.concluido ? 'line-through' : 'none'}}>{ex.nome}</strong>
              </div>
              <img src={ex.foto} style={styles.exerciseImgSmall} alt=""/>
            </div>
            <div style={styles.rowInputs}>
              <div style={{flex:1}}><label style={styles.labelInput}>Séries</label><input defaultValue={ex.series} onBlur={(e)=>atualizarExercicioGlobal(ex.nome, "series", e.target.value)} style={styles.inputPequeno}/></div>
              <div style={{flex:1}}><label style={styles.labelInput}>Peso (kg)</label><input defaultValue={ex.carga} onBlur={(e)=>atualizarExercicioGlobal(ex.nome, "carga", e.target.value)} style={styles.inputPequeno}/></div>
            </div>
            <textarea defaultValue={ex.obs || ""} onBlur={(e)=>atualizarExercicioGlobal(ex.nome, "obs", e.target.value)} placeholder="Notas do treino..." style={styles.textareaObs}/>
          </div>
        ))}

        <h4 style={styles.titleSection}>Treinos do Ciclo</h4>
        <div style={styles.addArea}>
          <input value={novoNome} onChange={(e)=>setNovoNome(e.target.value)} placeholder="Nome: Treino A" style={styles.inputTreino}/>
          <button onClick={async () => {
            if (!novoNome) return;
            const docRef = await addDoc(collection(db, "treinos"), { 
              nome: novoNome, cicloId: cicloSelecionado.id, userId: user.uid, ordem: meusTreinos.length 
            });
            if (!cicloSelecionado.ultimoTreinoId) {
              await updateDoc(doc(db, "ciclos", cicloSelecionado.id), { ultimoTreinoId: docRef.id, ultimoTreinoNome: novoNome });
              setCicloSelecionado(prev => ({...prev, ultimoTreinoId: docRef.id, ultimoTreinoNome: novoNome}));
            }
            setNovoNome('');
          }} style={styles.btnAdd}>+</button>
        </div>
        
        <div style={{marginTop: '15px'}}>
          {meusTreinos.map((t, index) => (
            <div key={t.id} style={styles.treinoCard} onClick={() => setTreinoSelecionado(t)}>
              <div style={{display:'flex', flexDirection:'column', gap:'4px', marginRight:'12px'}}>
                <button onClick={(e)=>{e.stopPropagation(); moverTreino(index, -1)}} style={styles.btnSeta}>▲</button>
                <button onClick={(e)=>{e.stopPropagation(); moverTreino(index, 1)}} style={styles.btnSeta}>▼</button>
              </div>
              <span style={{flex:1, fontWeight:'bold'}}>{t.nome}</span>
              <button onClick={(e) => handleDeleteItem("treinos", t.id, e)} style={{color:'red', border:'none', background:'none', padding:'10px', fontSize:'18px'}}>✕</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  // TELA INICIAL (LISTA DE CICLOS)
  return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <span>Olá, {user.displayName?.split(' ')[0]}</span>
        <button onClick={() => signOut(auth)} style={styles.btnLogout}>Sair</button>
      </header>
      <main style={styles.main}>
        <div style={styles.cardPersonal}>
          <h4 style={{margin:0, color:'#1976d2'}}>Novo Ciclo / Aluno</h4>
          <input value={emailAluno} onChange={(e)=>setEmailAluno(e.target.value)} placeholder="E-mail do Aluno (opcional)" style={{...styles.inputTreino, width:'100%', marginTop:'10px', boxSizing:'border-box'}}/>
          <div style={{...styles.addArea, marginTop:'10px'}}>
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

        <h2 style={{fontSize: '1.2rem', marginBottom: '15px'}}>Seus Ciclos</h2>
        {meusCiclos.map(c => {
          const souDono = c.userId === user.uid;
          if (!souDono && c.status === "pendente") return (
            <div key={c.id} style={styles.cardInvite}>
              <p><b>{c.nome}</b> enviado para você.</p>
              <div style={{display:'flex', gap:'10px'}}>
                <button onClick={()=>updateDoc(doc(db, "ciclos", c.id), {status: "aceito"})} style={styles.btnAceitar}>Aceitar</button>
                <button onClick={(e)=>handleDeleteItem("ciclos", c.id, e)} style={styles.btnRecusar}>Recusar</button>
              </div>
            </div>
          );
          return (
            <div key={c.id} style={{...styles.treinoCard, borderLeft: souDono ? '5px solid #007bff' : '5px solid #10b981'}} onClick={() => setCicloSelecionado(c)}>
              <div style={{ flex: 1 }}><strong>{c.nome}</strong><br/><small>{souDono ? `Aluno: ${c.alunoEmail || 'Eu'}` : '⭐ Treino Recebido'}</small></div>
              <button onClick={(e) => handleDeleteItem("ciclos", c.id, e)} style={{ color: '#ff4444', border: 'none', background: 'none', fontSize: '18px' }}>✕</button>
            </div>
          );
        })}
      </main>
    </div>
  );
}

const styles = {
  containerMobile: { maxWidth: '430px', minHeight: '100vh', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#F8F9FA' },
  contentCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  btnGoogle: { padding: '12px 24px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '30px', fontWeight:'bold', cursor:'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#fff', borderBottom: '1px solid #EEE' },
  main: { padding: '20px' },
  cardPersonal: { backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '15px', marginBottom: '15px', border: '1px solid #bbdefb' },
  addArea: { display: 'flex', gap: '10px' },
  inputTreino: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #DDD', outline: 'none' },
  inputHeaderInvisible: { border: 'none', fontSize: '18px', fontWeight: 'bold', outline: 'none', width: '70%', background: 'transparent' },
  btnAdd: { backgroundColor: '#007bff', color: 'white', border: 'none', width: '45px', borderRadius: '10px', fontSize: '24px', cursor:'pointer' },
  treinoCard: { padding: '12px', backgroundColor: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor:'pointer' },
  btnSeta: { background: '#f0f0f0', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', padding: '2px 6px' },
  exerciseImgSmall: { width: '45px', height: '45px', borderRadius: '8px', objectFit:'cover' },
  btnAddSmall: { backgroundColor: '#28a745', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor:'pointer' },
  btnBack: { border: 'none', background: 'none', color: '#007bff', fontWeight: 'bold', cursor:'pointer', fontSize: '16px' },
  cardExecucao: { padding: '15px', backgroundColor: '#fff', borderRadius: '15px', marginBottom: '12px', border: '1px solid #EEE' },
  rowInputs: { display: 'flex', gap: '12px', marginTop: '10px' },
  labelInput: { fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' },
  inputPequeno: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' },
  cardTreinoDoDia: { background: '#1e293b', color: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', textAlign: 'center' },
  btnConcluir: { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', marginTop: '15px', fontWeight: 'bold', width: '100%', cursor:'pointer', fontSize: '16px' },
  btnLogout: { color: 'red', border: 'none', background: 'none', cursor:'pointer' },
  titleSection: { borderLeft: '4px solid #007bff', paddingLeft: '10px', margin: '25px 0 10px', fontWeight: 'bold' },
  cardInvite: { padding: '15px', backgroundColor: '#fff3e0', borderRadius: '12px', marginBottom: '10px', border: '1px solid #ffe0b2' },
  btnAceitar: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor:'pointer' },
  btnRecusar: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor:'pointer' },
  textareaObs: { width: '100%', marginTop: '12px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', resize: 'none', boxSizing: 'border-box', backgroundColor: '#f9f9f9', fontFamily: 'inherit' }
};

export default App;