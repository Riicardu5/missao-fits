import React, { useState, useEffect } from 'react'
import { auth, provider, db } from './firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { 
  collection, addDoc, query, where, onSnapshot, 
  doc, deleteDoc, updateDoc, or 
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
        const q = query(
          collection(db, "ciclos"), 
          or(where("userId", "==", currentUser.uid), where("alunoEmail", "==", currentUser.email.toLowerCase()))
        );
        onSnapshot(q, (snapshot) => {
          const lista = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          lista.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setMeusCiclos(lista);
        });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (cicloSelecionado?.id) {
      const q = query(collection(db, "treinos"), where("cicloId", "==", cicloSelecionado.id));
      const unsub = onSnapshot(q, (snapshot) => {
        const listaDoBanco = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        listaDoBanco.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        
        setMeusTreinos(prev => {
          const IDsDoBanco = new Set(listaDoBanco.map(t => t.id));
          const temporarios = prev.filter(t => t.id === 'temp' && !IDsDoBanco.has(t.id));
          return [...listaDoBanco, ...temporarios];
        });
      });
      return () => unsub();
    } else {
      setMeusTreinos([]);
    }
  }, [cicloSelecionado?.id]);

  useEffect(() => {
    if (cicloSelecionado?.ultimoTreinoId) {
      const q = query(collection(db, "exercicios_treino"), where("treinoId", "==", cicloSelecionado.ultimoTreinoId));
      onSnapshot(q, (snapshot) => setExerciciosDoDia(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
    } else {
      setExerciciosDoDia([]);
    }
  }, [cicloSelecionado?.ultimoTreinoId]);

  useEffect(() => {
    if (treinoSelecionado) {
      const q = query(collection(db, "exercicios_treino"), where("treinoId", "==", treinoSelecionado.id));
      onSnapshot(q, (snapshot) => setExerciciosParaEditar(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
    }
  }, [treinoSelecionado?.id]);

  const handleDelete = async (colecao, id) => {
    if (window.confirm("Tem certeza que deseja excluir?")) {
      try {
        await deleteDoc(doc(db, colecao, id));
        if(colecao === "treinos") setMeusTreinos(prev => prev.filter(t => t.id !== id));
      } catch (err) { alert("Erro de permissão."); }
    }
  };

  const concluirTreinoDodia = async () => {
    if (!cicloSelecionado || meusTreinos.length === 0) return;
    
    const indexAtual = meusTreinos.findIndex(t => t.id === cicloSelecionado.ultimoTreinoId);
    let proximoIndex = indexAtual + 1 >= meusTreinos.length ? 0 : indexAtual + 1;
    const proximoTreino = meusTreinos[proximoIndex];

    if (proximoTreino) {
      await updateDoc(doc(db, "ciclos", cicloSelecionado.id), { 
        ultimoTreinoId: proximoTreino.id, 
        ultimoTreinoNome: proximoTreino.nome 
      });
      // Atualiza o estado local para refletir a mudança visual na hora
      setCicloSelecionado(prev => ({...prev, ultimoTreinoId: proximoTreino.id, ultimoTreinoNome: proximoTreino.nome}));
      
      // Reseta os checks de conclusão
      exerciciosDoDia.forEach(ex => updateDoc(doc(db, "exercicios_treino", ex.id), { concluido: false }));
    }
  };

  if (!user) return (
    <div style={styles.containerMobile}><div style={styles.contentCenter}>
      <h1>Missão Fits 💪</h1><button onClick={() => signInWithPopup(auth, provider)} style={styles.btnGoogle}>Entrar com Google</button>
    </div></div>
  );

  // TELA DE EDIÇÃO
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
              <button onClick={() => handleDelete("exercicios_treino", ex.id)} style={{color:'red', border:'none', background:'none'}}>✕</button>
            </div>
            <div style={styles.rowInputs}>
              <input defaultValue={ex.series} onBlur={(e)=>updateDoc(doc(db, "exercicios_treino", ex.id), {series: e.target.value})} placeholder="Séries" style={styles.inputPequeno}/>
              <input defaultValue={ex.carga} onBlur={(e)=>updateDoc(doc(db, "exercicios_treino", ex.id), {carga: e.target.value})} placeholder="Peso" style={styles.inputPequeno}/>
            </div>
          </div>
        ))}
        <h4 style={styles.titleSection}>Adicionar Exercício</h4>
        <input placeholder="Buscar..." value={busca} onChange={(e)=>setBusca(e.target.value)} style={styles.inputTreino}/>
        <div style={{marginTop:'10px', maxHeight:'250px', overflowY:'auto'}}>
          {bancoExercicios.filter(e => e.nome.toLowerCase().includes(busca.toLowerCase())).map(ex => (
            <div key={ex.id} style={styles.treinoCard} onClick={() => addDoc(collection(db, "exercicios_treino"), { treinoId: treinoSelecionado.id, userId: user.uid, nome: ex.nome, foto: ex.foto, series: '3', carga: '10', concluido: false })}>
               <span>{ex.nome}</span><button style={styles.btnAddSmall}>+</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  // TELA DO CICLO
  if (cicloSelecionado) return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <button onClick={() => setCicloSelecionado(null)} style={styles.btnBack}>← Voltar</button>
        <h3 style={{margin:0}}>{cicloSelecionado.nome}</h3>
      </header>
      <main style={styles.main}>
        <div style={styles.cardTreinoDoDia}>
          <div style={{fontSize:'22px', fontWeight:'bold'}}>{cicloSelecionado.ultimoTreinoNome || "Aguardando Treino"}</div>
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
            <div style={{display:'flex', gap:'15px', marginTop:'8px'}}>
              <small>Séries: <b>{ex.series}</b></small>
              <small>Peso: <b>{ex.carga}kg</b></small>
            </div>
          </div>
        ))}

        {cicloSelecionado.userId === user.uid && (
          <>
            <h4 style={styles.titleSection}>Gerenciar Treinos</h4>
            <div style={styles.addArea}>
              <input value={novoNome} onChange={(e)=>setNovoNome(e.target.value)} placeholder="Ex: Treino A" style={styles.inputTreino}/>
              <button onClick={async () => {
                if (!novoNome) return;
                const nomeFix = novoNome;
                setNovoNome('');
                setMeusTreinos(prev => [...prev, { id: 'temp', nome: nomeFix }]);
                const docRef = await addDoc(collection(db, "treinos"), { nome: nomeFix, cicloId: cicloSelecionado.id, userId: user.uid, createdAt: new Date() });
                if (!cicloSelecionado.ultimoTreinoId) {
                  await updateDoc(doc(db, "ciclos", cicloSelecionado.id), { ultimoTreinoId: docRef.id, ultimoTreinoNome: nomeFix });
                  setCicloSelecionado(prev => ({...prev, ultimoTreinoId: docRef.id, ultimoTreinoNome: nomeFix}));
                }
              }} style={styles.btnAdd}>+</button>
            </div>
            {meusTreinos.filter(t => t.id !== 'temp').map(t => (
              <div key={t.id} style={styles.treinoCard} onClick={()=>setTreinoSelecionado(t)}>
                <span>{t.nome}</span>
                <button onClick={(e)=>{e.stopPropagation(); handleDelete("treinos", t.id)}} style={{color:'red', border:'none', background:'none'}}>✕</button>
              </div>
            ))}
          </>
        )}
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
        <div style={styles.cardPersonal}>
          <h4 style={{margin:0, color:'#1976d2'}}>Área do Personal</h4>
          <input value={emailAluno} onChange={(e)=>setEmailAluno(e.target.value)} placeholder="E-mail do Aluno" style={{...styles.inputTreino, width:'100%', boxSizing:'border-box', marginTop:'10px'}}/>
        </div>
        <h2>Seus Objetivos</h2>
        <div style={styles.addArea}>
          <input value={novoNome} onChange={(e)=>setNovoNome(e.target.value)} placeholder="Ex: Projeto Verão" style={styles.inputTreino}/>
          <button onClick={async () => {
            if(!novoNome) return;
            await addDoc(collection(db, "ciclos"), { 
              nome: novoNome, userId: user.uid, createdAt: new Date(), 
              ultimoTreinoNome: 'Nenhum', alunoEmail: emailAluno.toLowerCase().trim(),
              status: emailAluno ? "pendente" : "aceito" 
            });
            setNovoNome(''); setEmailAluno('');
          }} style={styles.btnAdd}>+</button>
        </div>

        {meusCiclos.map(c => {
          const isAluno = c.userId !== user.uid;
          
          if (isAluno && c.status === "pendente") {
            return (
              <div key={c.id} style={styles.cardInvite}>
                <p><b>{c.nome}</b> enviado para você.</p>
                <div style={{display:'flex', gap:'10px'}}>
                  <button onClick={()=>updateDoc(doc(db, "ciclos", c.id), {status: "aceito"})} style={styles.btnAceitar}>Aceitar</button>
                  <button onClick={()=>handleDelete("ciclos", c.id)} style={styles.btnRecusar}>Recusar</button>
                </div>
              </div>
            );
          }

          return (
            <div key={c.id} style={{...styles.treinoCard, borderLeft: isAluno ? '5px solid #10b981' : '5px solid #007bff'}} onClick={() => setCicloSelecionado(c)}>
              <div style={{ flex: 1 }}>
                <strong>{c.nome} {c.exclusaoSolicitada && "⚠️ (Exclusão Solicitada)"}</strong><br/>
                <small>{isAluno ? '⭐ Professor' : `Aluno: ${c.alunoEmail || 'Eu'}`}</small>
              </div>
              {isAluno ? (
                 <button onClick={(e) => { e.stopPropagation(); updateDoc(doc(db, "ciclos", c.id), {exclusaoSolicitada: true}); alert("Solicitação enviada ao Personal!"); }} style={{ fontSize:'12px', color: '#666' }}>Pedir Exclusão</button>
              ) : (
                 <button onClick={(e) => { e.stopPropagation(); handleDelete("ciclos", c.id); }} style={{ color: '#ff4444', border: 'none', background: 'none' }}>✕</button>
              )}
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
  btnGoogle: { padding: '12px 24px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '30px', fontWeight:'bold', cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#fff', borderBottom: '1px solid #EEE' },
  main: { padding: '20px' },
  cardPersonal: { backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '15px', marginBottom: '15px', border: '1px solid #bbdefb' },
  addArea: { display: 'flex', gap: '10px', marginBottom: '20px' },
  inputTreino: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #DDD', outline: 'none' },
  btnAdd: { backgroundColor: '#007bff', color: 'white', border: 'none', width: '45px', borderRadius: '10px', fontSize: '20px', cursor:'pointer' },
  treinoCard: { padding: '15px', backgroundColor: '#fff', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor:'pointer' },
  exerciseImgSmall: { width: '40px', height: '40px', borderRadius: '6px', objectFit:'cover' },
  btnAddSmall: { backgroundColor: '#28a745', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '50%' },
  btnBack: { border: 'none', background: 'none', color: '#007bff', fontWeight: 'bold', cursor:'pointer' },
  cardExecucao: { padding: '15px', backgroundColor: '#fff', borderRadius: '15px', marginBottom: '10px', border: '1px solid #EEE' },
  rowInputs: { display: 'flex', gap: '8px', marginTop: '10px' },
  inputPequeno: { width: '100%', padding: '8px', border: '1px solid #eee', borderRadius: '6px', textAlign: 'center' },
  cardTreinoDoDia: { background: '#1e293b', color: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', textAlign: 'center' },
  btnConcluir: { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', marginTop: '15px', fontWeight: 'bold', width: '100%', cursor:'pointer' },
  btnLogout: { color: 'red', border: 'none', background: 'none', cursor:'pointer' },
  titleSection: { borderLeft: '4px solid #007bff', paddingLeft: '10px', margin: '25px 0 10px', fontWeight: 'bold' },
  cardInvite: { padding: '15px', backgroundColor: '#fff3e0', borderRadius: '12px', marginBottom: '10px', border: '1px solid #ffe0b2' },
  btnAceitar: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' },
  btnRecusar: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' },
  textareaObs: { width: '100%', marginTop: '10px', padding: '8px', borderRadius: '6px', border: '1px solid #eee', fontSize: '13px', resize: 'none', boxSizing: 'border-box' }
};

export default App;