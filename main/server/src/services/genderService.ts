/**
 * Detección automática de sexo a partir del nombre.
 * Usa un diccionario de nombres hispanos comunes en Costa Rica
 * y heurísticas de terminación como respaldo.
 */

const MASCULINOS = new Set([
  'AARON','ABEL','ABRAHAM','ADAN','ADRIAN','ALEJANDRO','ALEX','ALEXANDER',
  'ALEXIS','ALFREDO','ALLAN','ALVARO','ANDRES','ANGEL','ANTHONY','ANTONIO',
  'ARIEL','ARMANDO','ARTURO','BAYRON','BRANDON','BRAYAN','BRYAN','CARLOS',
  'CESAR','CHRISTIAN','CHRISTOPHER','DANIEL','DAVID','DEREK','DIEGO','DYLAN',
  'EDGAR','EDUARDO','ELIAS','EMANUEL','EMILIO','ENRIQUE','ERIC','ERNESTO',
  'ESTEBAN','FABIAN','FABRICIO','FEDERICO','FELIPE','FERNANDO','FRANCISCO',
  'GABRIEL','GERARDO','GILBERTH','GONZALO','GUILLERMO','GUSTAVO','HECTOR',
  'HENRY','HERNAN','HUGO','IGNACIO','ISAAC','ISMAEL','IVAN','JAFET','JAIME',
  'JASON','JAVIER','JEAN','JEREMY','JESUS','JOEL','JONATHAN','JORGE','JOSE',
  'JOSHUA','JUAN','JULIO','JUSTIN','KENDALL','KEVIN','LEONARDO','LUIS',
  'MANUEL','MARCO','MARCOS','MARIO','MARTIN','MATIAS','MAURICIO','MICHAEL',
  'MIGUEL','NELSON','NICOLAS','NOEL','OSCAR','PABLO','PATRICK','PEDRO',
  'RAFAEL','RAMON','RAUL','RICARDO','ROBERT','ROBERTO','RODRIGO','ROGER',
  'RONALD','SANTIAGO','SEBASTIAN','SERGIO','STEVEN','TOMAS','VICTOR',
  'WALTER','WILLIAM','YORDI',
]);

const FEMENINOS = new Set([
  'ADRIANA','ALEJANDRA','ALEXANDRA','ALICIA','AMANDA','AMELIA','ANA','ANDREA',
  'ANGELA','ANGIE','ANNA','ARIANA','BARBARA','BEATRIZ','BRENDA','CAMILA',
  'CARLA','CARMEN','CAROLINA','CATALINA','CINTHYA','CLAUDIA','CRISTINA',
  'DANIELA','DIANA','ELENA','ELIZABETH','EMILY','EMMA','ERIKA','ESTEFANIA',
  'ESTRELLA','EVA','FABIOLA','FERNANDA','FLORENCIA','GABRIELA','GENESIS',
  'GLORIA','GRACE','GUADALUPE','HELEN','INGRID','IRENE','ISABELLA','JENNIFER',
  'JESSICA','JIMENA','JOHANNA','JOSELYN','JULIA','JULIANA','KAREN','KARINA',
  'KARLA','KATHERINE','KAROL','KEYLA','LAURA','LEONELA','LILIA','LILIANA',
  'LUCIA','LUISA','MARCELA','MARGARITA','MARIA','MARIANA','MARIELA','MARLENE',
  'MARTHA','MELISSA','MICHELLE','MONICA','NADIA','NATALIA','NATASHA','NICOLE',
  'NOEMI','OLGA','PAMELA','PAOLA','PATRICIA','PAULA','PRISCILLA','RAQUEL',
  'REBECA','ROCIO','ROSA','ROSARIO','RUTH','SAMANTHA','SANDRA','SARA','SHARON',
  'SILVIA','SOFIA','SOLEDAD','SONIA','STEPHANIE','SUSANA','TATIANA','TERESA',
  'VALENTINA','VALERIA','VANESSA','VERONICA','VICTORIA','VIRGINIA','VIVIANA',
  'WENDY','XIMENA','YAMILETH','YARITZA','YORLENY','YULIANA','ZAIRA',
]);

/**
 * Detecta el sexo probable a partir del primer nombre del estudiante.
 * Retorna 'M', 'F', o '' si no se puede determinar.
 */
export function detectarSexo(nombre: string): 'M' | 'F' | '' {
  if (!nombre || !nombre.trim()) return '';

  const primer = nombre.trim().split(/\s+/)[0]
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (MASCULINOS.has(primer)) return 'M';
  if (FEMENINOS.has(primer)) return 'F';

  // Heurísticas por terminación (comunes en español)
  if (primer.endsWith('A')) return 'F';
  if (primer.endsWith('O')) return 'M';

  return '';
}
