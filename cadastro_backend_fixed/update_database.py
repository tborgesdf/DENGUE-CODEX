#!/usr/bin/env python3
"""
Script para atualizar o banco de dados e adicionar a coluna relatoriosGemini
"""

import sqlite3
import os

def update_database():
    db_path = 'src/database/app.db'
    
    if not os.path.exists(db_path):
        print(f"Banco de dados não encontrado em: {db_path}")
        return
    
    try:
        # Conectar ao banco
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar se a coluna já existe
        cursor.execute("PRAGMA table_info(registrations)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'relatoriosGemini' not in columns:
            print("Adicionando coluna relatoriosGemini...")
            cursor.execute("ALTER TABLE registrations ADD COLUMN relatoriosGemini TEXT")
            conn.commit()
            print("Coluna relatoriosGemini adicionada com sucesso!")
        else:
            print("Coluna relatoriosGemini já existe.")
        
        # Verificar se as colunas photos e photo_locations existem
        if 'photos' not in columns:
            print("Adicionando coluna photos...")
            cursor.execute("ALTER TABLE registrations ADD COLUMN photos TEXT")
            conn.commit()
            print("Coluna photos adicionada com sucesso!")
        
        if 'photo_locations' not in columns:
            print("Adicionando coluna photo_locations...")
            cursor.execute("ALTER TABLE registrations ADD COLUMN photo_locations TEXT")
            conn.commit()
            print("Coluna photo_locations adicionada com sucesso!")
        
        # Mostrar estrutura atual da tabela
        cursor.execute("PRAGMA table_info(registrations)")
        print("\nEstrutura atual da tabela registrations:")
        for column in cursor.fetchall():
            print(f"  - {column[1]} ({column[2]})")
        
        conn.close()
        print("\nAtualização do banco de dados concluída!")
        
    except Exception as e:
        print(f"Erro ao atualizar banco de dados: {e}")
        if conn:
            conn.close()

if __name__ == "__main__":
    update_database() 