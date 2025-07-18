#!/usr/bin/env python3
"""
Script para atualizar o esquema do banco de dados com as novas colunas
"""

import sqlite3
import uuid
from datetime import datetime
import os

def update_database_schema():
    """Atualiza o esquema do banco de dados com as novas colunas"""
    
    db_path = 'src/database/app.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Banco de dados não encontrado em: {db_path}")
        return False
    
    try:
        # Conectar ao banco
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔧 Atualizando esquema do banco de dados...")
        
        # Verificar se as colunas já existem
        cursor.execute("PRAGMA table_info(registrations)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Lista de novas colunas a serem adicionadas (sem UNIQUE inicialmente)
        new_columns = [
            ('registration_uuid', 'TEXT'),
            ('registration_date', 'DATE'),
            ('registration_time', 'TIME'),
            ('agent_name', 'VARCHAR(100)'),
            ('agent_id', 'VARCHAR(50)')
        ]
        
        # Adicionar colunas que não existem
        for column_name, column_type in new_columns:
            if column_name not in columns:
                print(f"  ➕ Adicionando coluna: {column_name}")
                cursor.execute(f"ALTER TABLE registrations ADD COLUMN {column_name} {column_type}")
                
                # Se for registration_uuid, gerar UUIDs para registros existentes
                if column_name == 'registration_uuid':
                    cursor.execute("SELECT id FROM registrations WHERE registration_uuid IS NULL")
                    existing_records = cursor.fetchall()
                    
                    for record_id in existing_records:
                        new_uuid = str(uuid.uuid4())
                        cursor.execute(
                            "UPDATE registrations SET registration_uuid = ? WHERE id = ?",
                            (new_uuid, record_id[0])
                        )
                        print(f"    ✅ Gerado UUID para registro {record_id[0]}: {new_uuid}")
                    
                    # Agora adicionar a constraint UNIQUE
                    try:
                        cursor.execute("CREATE UNIQUE INDEX idx_registration_uuid ON registrations(registration_uuid)")
                        print("    ✅ Adicionada constraint UNIQUE para registration_uuid")
                    except sqlite3.IntegrityError as e:
                        print(f"    ⚠️ Erro ao adicionar UNIQUE constraint: {e}")
                
                # Se for registration_date ou registration_time, preencher com dados de created_at
                elif column_name in ['registration_date', 'registration_time']:
                    if column_name == 'registration_date':
                        cursor.execute("""
                            UPDATE registrations 
                            SET registration_date = DATE(created_at) 
                            WHERE registration_date IS NULL
                        """)
                    elif column_name == 'registration_time':
                        cursor.execute("""
                            UPDATE registrations 
                            SET registration_time = TIME(created_at) 
                            WHERE registration_time IS NULL
                        """)
                    print(f"    ✅ Preenchido {column_name} com dados de created_at")
                
                # Se for agent_name ou agent_id, definir valores padrão
                elif column_name == 'agent_name':
                    cursor.execute("""
                        UPDATE registrations 
                        SET agent_name = 'Sistema' 
                        WHERE agent_name IS NULL
                    """)
                    print(f"    ✅ Definido valor padrão para {column_name}")
                
                elif column_name == 'agent_id':
                    cursor.execute("""
                        UPDATE registrations 
                        SET agent_id = 'AUTO' 
                        WHERE agent_id IS NULL
                    """)
                    print(f"    ✅ Definido valor padrão para {column_name}")
            else:
                print(f"  ✅ Coluna {column_name} já existe")
        
        # Commit das alterações
        conn.commit()
        
        # Verificar resultado
        cursor.execute("PRAGMA table_info(registrations)")
        final_columns = [column[1] for column in cursor.fetchall()]
        
        print("\n📊 Estrutura final da tabela registrations:")
        for column in final_columns:
            print(f"  - {column}")
        
        # Contar registros
        cursor.execute("SELECT COUNT(*) FROM registrations")
        total_records = cursor.fetchone()[0]
        print(f"\n📈 Total de registros: {total_records}")
        
        conn.close()
        print("\n✅ Atualização do banco de dados concluída com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao atualizar banco de dados: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    print("🚀 Iniciando atualização do esquema do banco de dados...")
    print("=" * 60)
    
    success = update_database_schema()
    
    print("=" * 60)
    if success:
        print("🎉 Atualização concluída com sucesso!")
        print("\n📝 Próximos passos:")
        print("1. Reinicie o servidor Flask")
        print("2. Teste o sistema com os novos campos")
        print("3. Verifique se as buscas estão funcionando")
    else:
        print("⚠️ Erro na atualização. Verifique os logs acima.") 