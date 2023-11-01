import { Suspense, useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, TransformControls, ContactShadows, useGLTF, useCursor } from '@react-three/drei'
import { proxy, useSnapshot } from 'valtio'

// Reactive state model, using Valtio ...
const modes = ['translate', 'rotate', 'scale']
const state = proxy({ current: null, mode: 0, selectedModels: new Set() })

function Model({ name, checkboxChecked,applied, ...props }) {
  // Ties this component to the state model
  const snap = useSnapshot(state)
  // Fetching the GLTF, nodes is a collection of all the meshes
  // It's cached/memoized, it only gets loaded and parsed once
  const { nodes } = useGLTF('/compressed.glb')
  // Feed hover state into useCursor, which sets document.body.style.cursor to pointer|auto
  const [hovered, setHovered] = useState(false)
  const isSelected = snap.selectedModels.has(name)
  const isCurrent = snap.current === name
  const setColor = checkboxChecked ? (isSelected ? 'green' :applied? 'red': 'white') : (isCurrent ? '#ff6080' : 'white');

  useCursor(hovered)
  return (
    <mesh
      // Click sets the mesh as the new target
      // onClick={(e) => (e.stopPropagation(), (state.current = name))}
      onClick={(e) => {
        e.stopPropagation()
        state.current = name
        if(checkboxChecked){
          if (snap.selectedModels.has(name)) {
            // Deselect the model if it's already selected
            state.selectedModels.delete(name)
          } else {
            // Select the model if it's not selected
            state.selectedModels.add(name)
          }
        }
      }}
      // If a click happened but this mesh wasn't hit we null out the target,
      // This works because missed pointers fire before the actual hits
      onPointerMissed={(e) => e.type === 'click' && (state.current = null)}
      // Right click cycles through the transform modes
      onContextMenu={(e) => snap.current === name && (e.stopPropagation(), (state.mode = (snap.mode + 1) % modes.length))}
      onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
      onPointerOut={(e) => setHovered(false)}
      name={name}
      geometry={nodes[name].geometry}
      material={nodes[name].material}
      material-color={setColor}
      {...props}
      dispose={null}
    />
  )
}

function Controls() {
  // Get notified on changes to state
  const snap = useSnapshot(state)
  const scene = useThree((state) => state.scene)
  return (
    <>
      {/* As of drei@7.13 transform-controls can refer to the target by children, or the object prop */}
      {snap.current && <TransformControls object={scene.getObjectByName(snap.current)} mode={modes[snap.mode]} />}
      {/* makeDefault makes the controls known to r3f, now transform-controls can auto-disable them when active */}
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
    </>
  )
}

export default function App() {
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const[applied , setApplied] = useState(false);

  const resetState = () => {
    // Reset the state to its initial values
    state.current = null;
    state.mode = 0;
    state.selectedModels.clear();
  };

  const handleCancelClick = () => {
    // Call the resetState function when the "Cancel" button is clicked
    resetState();
    setCheckboxChecked(false);
    setApplied(false);
  };

  const handleOKClick = () => {
    // Check if the selected models are "Rocket003", "Table", and "DNA"
    setApplied(true);
    if (
      state.selectedModels.size === 3 &&
      state.selectedModels.has('Rocket003') &&
      state.selectedModels.has('Table') &&
      state.selectedModels.has('DNA')
    ) {
      // Redirect to google.com
      console.log("yes")
      window.location.href = 'https://www.google.com';
    }
  };

  return (
    <>
      <label>
        <input type="checkbox" checked={checkboxChecked} onChange={() => setCheckboxChecked(!checkboxChecked)} />
        Select Models
      </label>
      {checkboxChecked && (
        <div>
          <button onClick={handleOKClick}>OK</button>
          <button onClick={handleCancelClick}>Cancel</button>
        </div>
      )}
      <Canvas camera={{ position: [0, -10, 80], fov: 50 }} dpr={[1, 2]}>
        <pointLight position={[100, 100, 100]} intensity={0.8} />
        <hemisphereLight color="#ffffff" groundColor="#b9b9b9" position={[-7, 25, 13]} intensity={0.85} />
        <Suspense fallback={null}>
          <group position={[0, 10, 0]}>
            <Model name="Curly" position={[1, -11, -20]} rotation={[2, 0, -0]} checkboxChecked={checkboxChecked}  applied={applied}/>
            <Model name="DNA" position={[20, 0, -17]} rotation={[1, 1, -2]} checkboxChecked={checkboxChecked}  applied={applied}/>
            <Model name="Headphones" position={[20, 2, 4]} rotation={[1, 0, -1]} checkboxChecked={checkboxChecked}  applied={applied}/>
            <Model name="Notebook" position={[-21, -15, -13]} rotation={[2, 0, 1]} checkboxChecked={checkboxChecked}  applied={applied} />
            <Model name="Rocket003" position={[18, 15, -25]} rotation={[1, 1, 0]} checkboxChecked={checkboxChecked}  applied={applied}/>
            <Model name="Roundcube001" position={[-25, -4, 5]} rotation={[1, 0, 0]} scale={0.5} checkboxChecked={checkboxChecked}  applied={applied}/>
            <Model name="Table" position={[1, -4, -28]} rotation={[1, 0, -1]} scale={0.5} checkboxChecked={checkboxChecked}  applied={applied}/>
            <Model name="VR_Headset" position={[7, -15, 28]} rotation={[1, 0, -1]} scale={5} checkboxChecked={checkboxChecked} applied={applied}/>
            <Model name="Zeppelin" position={[-20, 10, 10]} rotation={[3, -1, 3]} scale={0.005} checkboxChecked={checkboxChecked} applied={applied} />
            <ContactShadows rotation-x={Math.PI / 2} position={[0, -35, 0]} opacity={0.25} width={200} height={200} blur={1} far={50} checkboxChecked={checkboxChecked} applied={applied} />
          </group>
        </Suspense>
        <Controls />
      </Canvas>
    </>
  )
}
