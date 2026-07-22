import React from 'react';

export const ExcellentiaBadge = ({ data }) => {
  return (
    <div className="badge-wrapper" style={{ 
      backgroundColor: '#1E3A8A', 
      backgroundImage: `url('/excellentia-bg.jpeg')`,
      color: 'white'
    }}>
      {/* Photo de l'étudiant */}
      {data.photo && (
        <img 
          src={data.photo} 
          alt="Student" 
          className="badge-photo"
          style={{
            top: '124px',
            left: '104px',
            width: '192px',
            height: '192px',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      )}

      {/* Nom et Post-nom */}
      <div className="badge-text" style={{ top: '360px', fontSize: '28px', lineHeight: '1.1', fontWeight: '800' }}>
        <div><span>{data.firstName?.toUpperCase() || ''}</span></div>
        <div><span>{data.lastName?.toUpperCase() || ''}</span></div>
      </div>
      
      {/* Prénom */}
      <div className="badge-text" style={{ top: '425px', fontSize: '18px', fontWeight: '600' }}>
        <span>{data.middleName?.toUpperCase() || ''}</span>
      </div>

      {/* ID Number (Dans le cadre rouge) */}
      <div className="badge-text" style={{ 
        top: '484px', 
        fontSize: '18px', 
        fontWeight: 'bold'
      }}>
        <span>ID: {data.idNumber || ''}</span>
      </div>

      {/* N° (En dessous de l'ID) */}
      <div className="badge-text" style={{ 
        top: '512px', 
        fontSize: '14px', 
        fontWeight: 'bold'
      }}>
        <span>N°: {data.badgeNumber || ''}</span>
      </div>
    </div>
  );
};

export const LualabaBadge = ({ data }) => {
  return (
    <div className="badge-wrapper" style={{ 
      backgroundColor: '#2A0B2C', 
      backgroundImage: `url('/Lualaba-bg.png')`,
      color: 'white',
      fontFamily: "'Montserrat', 'Inter', sans-serif"
    }}>
      {/* Photo de l'étudiant */}
      {data.photo && (
        <img 
          src={data.photo} 
          alt="Student" 
          className="badge-photo"
          style={{
            top: '168px',
            left: '110px',
            width: '180px',
            height: '180px',
            border: '4px solid white',
            borderRadius: '0px',
            objectFit: 'cover'
          }}
        />
      )}

      {/* Nom et Post-nom */}
      <div className="badge-text" style={{ 
        top: '378px', 
        fontSize: '22px', 
        lineHeight: '1.2', 
        fontWeight: '900',
        textTransform: 'uppercase',
        padding: '0 20px'
      }}>
        <span>{`${data.lastName || ''} ${data.firstName || ''}`}</span>
      </div>
      
      {/* Prénom */}
      <div className="badge-text" style={{ 
        top: '412px', 
        fontSize: '22px', 
        fontWeight: '900',
        textTransform: 'uppercase',
        padding: '0 20px'
      }}>
        <span>{data.middleName || ''}</span>
      </div>

      {/* ID Number (Texte sur la pillule dessinée dans le fond) */}
      <div className="badge-text" style={{ 
        top: '453px', 
        left: '0px',
        width: '100%',
        textAlign: 'center',
        fontSize: '22px', 
        fontWeight: '900',
        color: 'white',
        letterSpacing: '1px'
      }}>
        <span>{data.idNumber || ''}</span>
      </div>

      {/* N° de série (En dessous de l'ID) */}
      <div className="badge-text" style={{ 
        top: '495px', 
        left: '0px',
        width: '100%',
        textAlign: 'center',
        fontSize: '18px', 
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: '2px'
      }}>
        <span>N°: {data.badgeNumber || ''}</span>
      </div>
    </div>
  );
};

export const WantashiBadge = ({ data }) => {
  return (
    <div className="badge-wrapper" style={{ 
      backgroundColor: '#1E3A8A', 
      backgroundImage: `url('/Programme%20Wantadhi.png')`, /* Nom exact du fichier */
      color: 'white',
      fontFamily: "'Montserrat', 'Inter', sans-serif"
    }}>
      {/* Photo de l'étudiant */}
      {data.photo && (
        <img 
          src={data.photo} 
          alt="Student" 
          className="badge-photo"
          style={{
            top: '168px',
            left: '110px',
            width: '180px',
            height: '180px',
            border: '4px solid white',
            borderRadius: '0px', /* Carré comme Lualaba (à confirmer si rond) */
            objectFit: 'cover'
          }}
        />
      )}

      {/* Nom et Post-nom */}
      <div className="badge-text" style={{ 
        top: '378px', 
        left: '0px',
        width: '100%',
        textAlign: 'center',
        fontSize: '22px', 
        lineHeight: '1.2', 
        fontWeight: '900',
        textTransform: 'uppercase',
        padding: '0 20px',
        color: '#1E3A8A' /* Bleu foncé */
      }}>
        <span>{`${data.lastName || ''} ${data.firstName || ''}`}</span>
      </div>
      
      {/* Prénom */}
      <div className="badge-text" style={{ 
        top: '412px', 
        left: '0px',
        width: '100%',
        textAlign: 'center',
        fontSize: '22px', 
        fontWeight: '900',
        textTransform: 'uppercase',
        padding: '0 20px',
        color: '#1E3A8A' /* Bleu foncé */
      }}>
        <span>{data.middleName || ''}</span>
      </div>

      {/* ID Number */}
      <div className="badge-text" style={{ 
        top: '453px', 
        left: '0px',
        width: '100%',
        textAlign: 'center',
        fontSize: '22px', 
        fontWeight: '900',
        color: 'white',
        letterSpacing: '1px'
      }}>
        <span>{data.idNumber || ''}</span>
      </div>

      {/* N° de série (En dessous de l'ID) */}
      <div className="badge-text" style={{ 
        top: '495px', 
        left: '0px',
        width: '100%',
        textAlign: 'center',
        fontSize: '18px', 
        fontWeight: 'bold',
        color: '#1E3A8A', /* Bleu foncé pour Wantashi */
        letterSpacing: '2px'
      }}>
        <span>N°: {data.badgeNumber || ''}</span>
      </div>
    </div>
  );
};
