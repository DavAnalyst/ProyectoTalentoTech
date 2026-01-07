class CompanyKnowledgeBase:
    def __init__(self):
        self.company_info = {
            "servicios": {
                "construccion": "Cimientos Construcciones S.A.S. ofrece construcción residencial y comercial con más de 15 años de experiencia en el sector. Nos especializamos en proyectos de alta calidad y acabados premium.",
                "remodelaciones": "Realizamos remodelaciones integrales de viviendas, oficinas y locales comerciales. Desde diseño hasta ejecución completa con garantía de 2 años.",
                "simulador_pisos": "Nuestro innovador simulador de pisos utiliza inteligencia artificial DALL-E para generar texturas realistas de materiales como madera, cerámica, mármol, concreto, piedra y laminado.",
                "diseño": "Servicio completo de diseño arquitectónico e interiores personalizado con renderizado 3D y planimetría detallada."
            },
            "materiales_pisos": {
                "madera": {
                    "descripcion": "Pisos de madera natural, engineered y laminada de alta calidad. Resistentes al tráfico pesado.",
                    "ventajas": ["Calidez natural", "Durabilidad superior", "Aumenta valor inmobiliario"],
                    "precio_m2": "desde $85.000 COP/m²",
                    "instalacion": "Instalación profesional incluida con garantía de 5 años"
                },
                "ceramica": {
                    "descripcion": "Cerámica nacional e importada, porcelanato y gres de primera calidad",
                    "ventajas": ["Fácil mantenimiento", "Gran variedad de diseños", "Resistente al agua"],
                    "precio_m2": "desde $45.000 COP/m²",
                    "instalacion": "Instalación con mortero de alta adherencia"
                },
                "marmol": {
                    "descripcion": "Mármol natural travertino, carrara y nacional para espacios elegantes",
                    "ventajas": ["Lujo y sofisticación", "Único en cada pieza", "Duración vitalicia"],
                    "precio_m2": "desde $150.000 COP/m²",
                    "instalacion": "Instalación especializada con sellado profesional"
                },
                "concreto": {
                    "descripcion": "Pisos de concreto pulido, estampado y microcemento para estilo industrial moderno",
                    "ventajas": ["Estilo moderno", "Bajo mantenimiento", "Versatilidad de acabados"],
                    "precio_m2": "desde $65.000 COP/m²"
                }
            },
            "empresa": {
                "historia": "Fundada en 2008, Cimientos Construcciones S.A.S. ha completado más de 500 proyectos en Bogotá y Cundinamarca",
                "mision": "Construir espacios que mejoren la calidad de vida de nuestros clientes con tecnología innovadora y materiales de primera calidad",
                "valores": ["Calidad", "Innovación", "Responsabilidad", "Compromiso con el cliente"]
            },
            "contacto": {
                "telefono": "+57 320 273 8391",
                "whatsapp": "+57 300 749 7544",
                "email": "cimientos2025@gmail.com",
                "direccion": "Cl. 128 #88 B – 10, Suba, Bogotá",
                "horarios": "Lunes a Viernes: 8:00 AM - 6:00 PM | Sábados: 9:00 AM - 4:00 PM"
            },
            "simulador": {
                "como_funciona": "1. Selecciona el material deseado, 2. Haz clic en 'Generar Piso', 3. Nuestra IA crea una textura realista, 4. Ve el resultado aplicado en una habitación real",
                "materiales_disponibles": "Madera, cerámica, mármol, concreto pulido, piedra natural y laminado",
                "tecnologia": "Utilizamos DALL-E de OpenAI para generar texturas fotorrealistas basadas en materiales reales"
            }
        }
    
    def get_context_for_query(self, user_message):
        """Extrae información relevante basada en la consulta del usuario"""
        context_parts = []
        message_lower = user_message.lower()
        
        # Detectar consultas sobre servicios
        if any(word in message_lower for word in ["servicio", "qué hacen", "empresa", "ofrecen", "trabajo"]):
            context_parts.append(f"SERVICIOS: {self.company_info['servicios']}")
        
        # Detectar consultas sobre pisos y materiales
        if any(word in message_lower for word in ["piso", "material", "madera", "cerámica", "mármol", "concreto", "precio"]):
            context_parts.append(f"MATERIALES DE PISOS: {self.company_info['materiales_pisos']}")
        
        # Detectar consultas sobre el simulador
        if any(word in message_lower for word in ["simulador", "funciona", "como usar", "inteligencia artificial", "ai"]):
            context_parts.append(f"SIMULADOR: {self.company_info['simulador']}")
        
        # Detectar consultas sobre contacto
        if any(word in message_lower for word in ["contacto", "teléfono", "dirección", "ubicación", "horario"]):
            context_parts.append(f"CONTACTO: {self.company_info['contacto']}")
        
        # Detectar consultas sobre la empresa
        if any(word in message_lower for word in ["historia", "misión", "valores", "experiencia", "trayectoria"]):
            context_parts.append(f"EMPRESA: {self.company_info['empresa']}")
        
        return "\n".join(context_parts)