"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, type User } from "firebase/auth"
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase"
import { createOrUpdateUserProfile } from "@/lib/firestore"

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getFirebaseAuth()
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          await createOrUpdateUserProfile(user.uid, {
            displayName: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || "",
          })
        } catch (error) {
          console.error("プロフィール保存エラー:", error)
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth()
    const googleProvider = getGoogleProvider()

    if (!auth || !googleProvider) {
      throw new Error("Firebase is not initialized")
    }

    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error("ログインエラー:", error)
      throw error
    }
  }

  const signOut = async () => {
    const auth = getFirebaseAuth()

    if (!auth) {
      throw new Error("Firebase is not initialized")
    }

    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("ログアウトエラー:", error)
      throw error
    }
  }

  return <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
