import React, { useState, useEffect } from 'react'
import { auth, provider, db } from './firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { 
  collection, addDoc, query, where, onSnapshot, 
  orderBy, doc, deleteDoc, updateDoc, getDocs, limit 
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

  // 1. Monitora o usuário
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const q = query(collection(db, "ciclos"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        onSnapshot(q, (snapshot) => {
          setMeusCiclos(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        });
      }
    });
    return () => unsub();
  }, []);

  // 2. Busca Treinos do Ciclo
  useEffect(() => {
    if (cicloSelecionado?.id) {
      const q = query(
        collection(db, "treinos"), 
        where("cicloId", "==", cicloSelecionado.id), 
        orderBy("createdAt", "asc")
      );
      const unsubT = onSnapshot(q, (snapshot) => {
        setMeusTreinos(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      });
      return () => unsubT();
    }
  }, [cicloSelecionado?.id]);

  // 3. Busca Exercícios do Treino ATUAL do Ciclo (Treino do Dia)
  useEffect(() => {
    if (cicloSelecionado?.ultimoTreinoId) {
      // Limpa a lista antes de buscar a nova para evitar o bug de "exercício antigo"
      setExerciciosDoDia([]); 
      const q = query(collection(db, "exercicios_treino"), where("treinoId", "==", cicloSelecionado.ultimoTreinoId));
      const unsubEx = onSnapshot(q, (snapshot) => {
        setExerciciosDoDia(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      });
      return () => unsubEx;
    }
  }, [cicloSelecionado?.ultimoTreinoId]); // Se mudar o ID do treino do dia, ele refaz a busca

  // 4. Busca Exercícios para a tela de EDIÇÃO
  useEffect(() => {
    if (treinoSelecionado) {
      const q = query(collection(db, "exercicios_treino"), where("treinoId", "==", treinoSelecionado.id));
      const unsubEdit = onSnapshot(q, (snapshot) => {
        setExerciciosParaEditar(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      });
      return () => unsubEdit();
    }
  }, [treinoSelecionado?.id]);

  const concluirTreinoDodia = async () => {
    if (!cicloSelecionado || meusTreinos.length === 0) return;
    const index = meusTreinos.findIndex(t => t.id === cicloSelecionado.ultimoTreinoId);
    let prox = index + 1 >= meusTreinos.length ? 0 : index + 1;
    const proxT = meusTreinos[prox];

    const novosDados = {
      ultimoTreinoId: proxT.id,
      ultimoTreinoNome: proxT.nome
    };

    await updateDoc(doc(db, "ciclos", cicloSelecionado.id), novosDados);
    // Força o estado local a atualizar para o useEffect (Passo 3) disparar
    setCicloSelecionado(prev => ({ ...prev, ...novosDados }));
  };

  // FUNÇÃO NOVA: Salva carga e busca se já existe em outro treino
  const salvarDadosExercicio = async (id, campo, valor, nomeExercicio) => {
    // 1. Atualiza o exercício atual
    await updateDoc(doc(db, "exercicios_treino", id), { [campo]: valor });

    // 2. Se for carga ou série, vamos tentar atualizar outros treinos com o mesmo nome (Opcional, mas ajuda)
    // Aqui ele salva apenas no atual, mas na hora de ADICIONAR um novo, ele vai puxar o último.
  };

  const adicionarExercicioAoTreino = async (ex) => {
    // Busca se você já usou esse exercício antes para puxar a última carga/série
    const q = query(
      collection(db, "exercicios_treino"), 
      where("userId", "==", user.uid), 
      where("nome", "==", ex.nome),
      limit(1)
    );
    const snap = await getDocs(q);
    let cargaAntiga = '';
    let seriesAntiga = '';
    
    if (!snap.empty) {
      cargaAntiga = snap.docs[0].data().carga;
      seriesAntiga = snap.docs[0].data().series;
    }

    await addDoc(collection(db, "exercicios_treino"), {
      treinoId: treinoSelecionado.id,
      userId: user.uid,
      nome: ex.nome,
      foto: ex.foto,
      series: seriesAntiga,
      carga: cargaAntiga,
      obs: ''
    });
  };

  const deletarItem = async (col, id) => {
    if(window.confirm("Excluir definitivamente?")) {
      try {
        await deleteDoc(doc(db, col, id));
      } catch (err) { console.error(err); }
    }
  };

  if (!user) return (
    <div style={styles.containerMobile}><div style={styles.contentCenter}>
      <h1>Missão Fits 💪</h1><button onClick={() => signInWithPopup(auth, provider)} style={styles.btnGoogle}>Entrar com Google</button>
    </div></div>
  );

  // TELA DE EDIÇÃO DE TREINO
  if (treinoSelecionado) return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <button onClick={() => setTreinoSelecionado(null)} style={styles.btnBack}>← Salvar e Voltar</button>
        <h3 style={{margin:0}}>{treinoSelecionado.nome}</h3>
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
              <input defaultValue={ex.series} onBlur={(e)=>salvarDadosExercicio(ex.id, "series", e.target.value, ex.nome)} placeholder="Séries" style={styles.inputPequeno}/>
              <input defaultValue={ex.carga} onBlur={(e)=>salvarDadosExercicio(ex.id, "carga", e.target.value, ex.nome)} placeholder="Carga" style={styles.inputPequeno}/>
            </div>
            <textarea 
              defaultValue={ex.obs} 
              onBlur={(e)=>updateDoc(doc(db, "exercicios_treino", ex.id), {obs: e.target.value})}
              placeholder="Observações (ex: banco inclinado...)" 
              style={styles.textareaObs}
            />
          </div>
        ))}
        <h4 style={styles.titleSection}>Adicionar Exercício</h4>
        <input placeholder="Buscar no banco..." value={busca} onChange={(e)=>setBusca(e.target.value)} style={styles.inputTreino}/>
        <div style={{marginTop:'15px', maxHeight:'300px', overflowY:'auto'}}>
          {bancoExercicios.filter(e => e.nome.toLowerCase().includes(busca.toLowerCase())).map(ex => (
            <div key={ex.id} style={styles.treinoCard}>
              <img src={ex.foto} style={styles.exerciseImg} alt=""/>
              <div style={{flex:1, marginLeft:'10px'}}><small>{ex.nome}</small></div>
              <button onClick={()=>adicionarExercicioAoTreino(ex)} style={styles.btnAddSmall}>+</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  // TELA DO CICLO (TREINO DO DIA)
  if (cicloSelecionado) return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <button onClick={() => setCicloSelecionado(null)} style={styles.btnBack}>← Ciclos</button>
        <h3 style={{margin:0}}>{cicloSelecionado.nome}</h3>
      </header>
      <main style={styles.main}>
        <div style={styles.cardTreinoDoDia}>
          <small>PRÓXIMO TREINO</small>
          <div style={{fontSize:'22px', fontWeight:'bold'}}>{cicloSelecionado.ultimoTreinoNome || "Crie um treino"}</div>
          <button onClick={concluirTreinoDodia} style={styles.btnConcluir}>CONCLUIR TREINO ✓</button>
        </div>

        {exerciciosDoDia.length === 0 && <p style={{textAlign:'center', color:'#999'}}>Nenhum exercício neste treino.</p>}

        {exerciciosDoDia.map(ex => (
          <div key={ex.id} style={styles.cardExecucao}>
            <div style={{display:'flex', alignItems:'center'}}>
              <img src={ex.foto} style={styles.exerciseImgSmall} alt=""/>
              <div style={{marginLeft:'10px'}}>
                <strong>{ex.nome}</strong><br/>
                <small style={{color:'#007bff'}}>{ex.series || '0'} séries • {ex.carga || '0kg'}</small>
                {ex.obs && <div style={{fontSize:'12px', color:'#666', fontStyle:'italic'}}>Obs: {ex.obs}</div>}
              </div>
            </div>
          </div>
        ))}
        
        <h4 style={styles.titleSection}>Gerenciar Treinos</h4>
        <div style={styles.addArea}>
          <input value={novoNome} onChange={(e)=>setNovoNome(e.target.value)} placeholder="Novo Treino (ex: Treino C)" style={styles.inputTreino}/>
          <button onClick={async ()=>{
            if(!novoNome) return;
            const docRef = await addDoc(collection(db,"treinos"), {
                nome: novoNome, 
                cicloId: cicloSelecionado.id, 
                userId: user.uid, 
                createdAt: new Date()
            });
            if(!cicloSelecionado.ultimoTreinoId) {
                await updateDoc(doc(db,"ciclos",cicloSelecionado.id), {
                    ultimoTreinoId: docRef.id, 
                    ultimoTreinoNome: novoNome
                });
                setCicloSelecionado(prev => ({...prev, ultimoTreinoId: docRef.id, ultimoTreinoNome: novoNome}));
            }
            setNovoNome('');
          }} style={styles.btnAdd}>+</button>
        </div>

        {meusTreinos.map(t => (
          <div key={t.id} style={styles.treinoCard} onClick={()=>setTreinoSelecionado(t)}>
            <strong>{t.nome}</strong>
            <div onClick={(e)=>e.stopPropagation()}>
               <button onClick={()=>deletarItem("treinos", t.id)} style={{color:'red', border:'none', background:'none', padding:'10px'}}>✕</button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );

  // TELA INICIAL (CICLOS)
  return (
    <div style={styles.containerMobile}>
      <header style={styles.header}>
        <span>Olá, {user.displayName?.split(' ')[0]}</span>
        <button onClick={() => signOut(auth)} style={styles.btnLogout}>Sair</button>
      </header>
      <main style={styles.main}>
        <h2>Seus Objetivos</h2>
        <div style={styles.addArea}>
          <input value={novoNome} onChange={(e)=>setNovoNome(e.target.value)} placeholder="Ex: Bulking 2026" style={styles.inputTreino}/>
          <button onClick={async () => {
            if(!novoNome) return;
            await addDoc(collection(db, "ciclos"), { 
                nome: novoNome, 
                userId: user.uid, 
                createdAt: new Date(), 
                ultimoTreinoNome: 'Nenhum' 
            });
            setNovoNome('');
          }} style={styles.btnAdd}>+</button>
        </div>
        {meusCiclos.map(c => (
          <div key={c.id} style={styles.treinoCard} onClick={() => setCicloSelecionado(c)}>
            <div style={{ flex: 1 }}>
              <strong>{c.nome}</strong><br/>
              <small style={{ color: '#666' }}>Próximo: {c.ultimoTreinoNome}</small>
            </div>
            <button onClick={(e) => { e.stopPropagation(); deletarItem("ciclos", c.id); }} style={{ color: '#ff4444', border: 'none', background: 'none', fontSize: '18px' }}>✕</button>
          </div>
        ))}
      </main>
    </div>
  );
}

const styles = {
  containerMobile: { maxWidth: '430px', minHeight: '100vh', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#F8F9FA', display: 'flex', flexDirection: 'column' },
  contentCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 },
  btnGoogle: { padding: '12px 24px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '30px', fontWeight:'bold', cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#fff', borderBottom: '1px solid #EEE' },
  main: { flex: 1, padding: '20px' },
  addArea: { display: 'flex', gap: '10px', marginBottom: '20px' },
  inputTreino: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #DDD' },
  btnAdd: { backgroundColor: '#007bff', color: 'white', border: 'none', width: '45px', borderRadius: '10px', fontSize: '20px', cursor: 'pointer' },
  treinoCard: { padding: '15px', backgroundColor: '#fff', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer' },
  exerciseImg: { width: '50px', height: '50px', borderRadius: '8px', objectFit:'cover' },
  btnAddSmall: { backgroundColor: '#28a745', color: 'white', border: 'none', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer' },
  btnBack: { border: 'none', background: 'none', color: '#007bff', fontWeight: 'bold', cursor: 'pointer' },
  cardExecucao: { padding: '12px', backgroundColor: '#fff', borderRadius: '12px', marginBottom: '10px', border: '1px solid #EEE' },
  exerciseImgSmall: { width: '50px', height: '50px', borderRadius: '6px', objectFit:'cover' },
  rowInputs: { display: 'flex', gap: '8px', marginTop: '10px' },
  inputPequeno: { width: '100%', padding: '8px', border: '1px solid #eee', borderRadius: '6px', textAlign: 'center', fontSize: '14px' },
  cardTreinoDoDia: { background: '#1e293b', color: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', textAlign: 'center' },
  btnConcluir: { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', marginTop: '15px', fontWeight: 'bold', width: '100%', cursor: 'pointer' },
  btnLogout: { color: 'red', border: 'none', background: 'none', cursor: 'pointer' },
  titleSection: { borderLeft: '4px solid #007bff', paddingLeft: '10px', margin: '25px 0 10px', fontWeight: 'bold' },
  textareaObs: { width: '100%', marginTop: '10px', padding: '8px', borderRadius: '6px', border: '1px solid #eee', fontSize: '13px', resize: 'none', boxSizing: 'border-box' }
};

export default App;