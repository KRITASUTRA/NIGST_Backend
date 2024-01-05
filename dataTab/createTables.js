const pool = require('../config/pool');


const createTables = async () => {
  const tables = [
    {
      name: 'faculty_name',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS faculty_name
        (
          id SERIAL PRIMARY KEY,
          name varchar(255) NOT NULL UNIQUE,
          f_id varchar(255) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'admin',
      dependencies: ['faculty_name'],
      definition: `
        CREATE TABLE IF NOT EXISTS admin (
          id SERIAL PRIMARY KEY,
          username varchar(255) NOT NULL UNIQUE,
          phone varchar(20),
          email varchar(255) NOT NULL UNIQUE,
          password varchar(255) NOT NULL,
          admin_id varchar(255) NOT NULL UNIQUE,
          role varchar(255)NOT NULL ,
          faculty varchar(255) NOT NULL UNIQUE REFERENCES faculty_name(name),
          reset_token varchar(255),
          create_at TIMESTAMP DEFAULT NOW(),
          update_at TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'course_category',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS course_category 
          (
            id serial PRIMARY KEY,
            course_category_name varchar(255) NOT NULL UNIQUE,
            category_id varchar(20) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT NOW()
          )
      `,
    },
    {
      name: 'category_code',
      dependencies: ['course_category'],
      definition: `
        CREATE TABLE IF NOT EXISTS category_code (
          id serial PRIMARY KEY,
          category varchar(255) REFERENCES course_category(course_category_name),
          code varchar(255) NOT NULL,
          CONSTRAINT uc_category_code UNIQUE (category, code)
        )
      `,
    },
    {
      name: 'category_number',
      dependencies: ['course_category'],
      definition: `
        CREATE TABLE IF NOT EXISTS category_number
        (
         id serial PRIMARY KEY,
         category varchar(255) REFERENCES course_category(course_category_name),
         number INTEGER NOT NULL,
         CONSTRAINT uc_category_number UNIQUE (category, number)
        )
      `,
    },
    {
      name: 'faculty_position',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS faculty_position
        (
          id SERIAL PRIMARY KEY,
          faculty_pos varchar(255) NOT NULL UNIQUE,
          position_id varchar(255) NOT NULL UNIQUE,
          description text
        )
      `,
    },
    {
      name: 'faculty',
      dependencies: ['faculty_name', 'faculty_position'],
      definition: `
        CREATE TABLE IF NOT EXISTS faculty 
        (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(255) NOT NULL,
          middle_name VARCHAR(255),
          last_name VARCHAR(255) NOT NULL,
          dob DATE NOT NULL,
          phone VARCHAR(20) NOT NULL,
          gender VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          education varchar(255) NOT NULL,
          designation varchar(255) NOT NULL DEFAULT 'faculty',
          faculty_id VARCHAR(20) NOT NULL UNIQUE,
          faculty varchar(255) NOT NULL REFERENCES faculty_name(name),
          photo_path varchar(255),
          profile VARCHAR(255) ,
          status BOOLEAN NOT NULL DEFAULT TRUE,
          admin_verified BOOLEAN NOT NULL DEFAULT FALSE,
          created_on_date_time TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'faculty_passwords',
      dependencies: ['faculty'],
      definition: `
        CREATE TABLE IF NOT EXISTS faculty_passwords 
        (
          id SERIAL PRIMARY KEY,
          faculty_email VARCHAR(255) NOT NULL REFERENCES faculty(email),
          password VARCHAR(255) NOT NULL,
          reset_token VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'faculty_position_assi',
      dependencies: ['faculty', 'faculty_position', 'admin'],
      definition: `
        CREATE TABLE IF NOT EXISTS faculty_position_assi(
          id SERIAL PRIMARY KEY,
          faculty_id varchar(255) NOT NULL REFERENCES faculty(faculty_id),
          faculty_pos varchar(255) NOT NULL REFERENCES faculty_position(faculty_pos),
          faculty_admin varchar(255) NOT NULL REFERENCES admin(faculty),
          position_assi_id integer NOT NULL ,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at DATE,
          CONSTRAINT unique_position_combination UNIQUE (faculty_id, faculty_pos, faculty_admin)
        )
      `,
    },
{
  name: 'organizations',
  dependencies: [],
  definition: `
  CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      organization VARCHAR(255) NOT NULL UNIQUE,  
      type VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      ministry VARCHAR(255),
      department VARCHAR(255),
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(255)
  )
  `,
},

{
  name: 'users',
  dependencies: ['organizations'],
  definition: `
  CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(255) NOT NULL,
      middle_name VARCHAR(255),
      last_name VARCHAR(255) NOT NULL,
      dob DATE NOT NULL,
      phone VARCHAR(20) NOT NULL UNIQUE,
      gender VARCHAR(255) NOT NULL DEFAULT 'DISCLOSED',
      email VARCHAR(255) NOT NULL UNIQUE,
      organization VARCHAR(255) REFERENCES organizations(organization),  -- Reference updated
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
      admin_verified BOOLEAN NOT NULL DEFAULT FALSE,
      student_id VARCHAR(30) NOT NULL UNIQUE, 
      user_status VARCHAR(30) DEFAULT 'ACTIVE',
      created_at TIMESTAMP,
      updated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'IST')
  )
  `,
},


    
    
    
    {
      name: 'password',
      dependencies: ['users'],
      definition: `
        CREATE TABLE IF NOT EXISTS password 
        (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL  REFERENCES users(email),
          reset_token VARCHAR(255),
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
    },
    {
      name: 'courses',
      dependencies: ['course_category', 'faculty'],
      definition: `
        CREATE TABLE IF NOT EXISTS courses 
        (
          id SERIAL PRIMARY KEY,
          course_category varchar(50) NOT NULL,
          course_code VARCHAR(50) NOT NULL,
          course_no INTEGER NOT NULL,
          title VARCHAR(255) NOT NULL UNIQUE,
          description text,
          course_mode varchar(30) NOT NULL, 
          course_id VARCHAR(255) NOT NULL UNIQUE,
          course_duration_weeks varchar(20) NOT NULL,
          course_duration_days varchar(20) NOT NULL,
          eligibility TEXT,
          course_type varchar(255) NOT NULL,
          course_director varchar(255) NOT NULL REFERENCES faculty(faculty_id),
          faculty varchar(255) NOT NULL,
          created_at DATE DEFAULT NOW(),
          CONSTRAINT unique_course_combination UNIQUE (course_category, course_code, course_no)
        )
      `,
    },
    {
      name: 'course_scheduler',
      dependencies: ['courses'],
      definition: `
        CREATE TABLE IF NOT EXISTS course_scheduler (
          id SERIAL primary key,
          name varchar(255) NOT NULL REFERENCES courses(title),
          course_id VARCHAR(255) NOT NULL REFERENCES courses(course_id),
          course_capacity INTEGER NOT NULL,
          date_comencement DATE NOT NULL,
          date_completion DATE NOT NULL,
          currency varchar(255) NOT NULL DEFAULT 'INR',
          fee VARCHAR(255) ,
          batch_no VARCHAR(255) NOT NULL,
          course_status VARCHAR(255) NOT NULL DEFAULT 'created',
          running_date date,
          course_scheduler_id varchar(255) NOT NULL UNIQUE,
          scheduled_at DATE DEFAULT NOW(),
          CONSTRAINT unique_course_batch UNIQUE (course_id, batch_no)
        )
      `,
    },
    {
      name: 'course_scheduler_archive',
      dependencies: ['courses'],
      definition: `
        CREATE TABLE IF NOT EXISTS course_scheduler_archive (
          id SERIAL primary key,
          name varchar(255) NOT NULL ,
          course_id VARCHAR(255) NOT NULL ,
          course_capacity INTEGER NOT NULL,
          date_comencement DATE NOT NULL,
          date_completion DATE NOT NULL,
          currency varchar(255) NOT NULL,
          fee VARCHAR(255) ,
          batch_no VARCHAR(255) NOT NULL,
          course_status VARCHAR(255) NOT NULL ,
          running_date date,
          course_scheduler_id varchar(255) NOT NULL,
          scheduled_at DATE ,
          archived_at DATE DEFAULT NOW()
        )
      `,
    },
    {
      name: 'announcement',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS announcement
        (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description text NOT NULL,
          url VARCHAR(255),
          pdf_path VARCHAR (255),
          status BOOLEAN DEFAULT FALSE,
          a_id VARCHAR(255) NOT NULL UNIQUE,
          created_at DATE DEFAULT NOW(),
          posted_at TIMESTAMP
        )
      `,
    },
    {
      name: 'archive_announcement',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS archive_announcement
        (
          id SERIAL PRIMARY KEY,  
          title VARCHAR(255) NOT NULL,
          description text NOT NULL,
          url VARCHAR(255),
          pdf_path VARCHAR (255),
          status BOOLEAN DEFAULT FALSE,
          a_id VARCHAR(255),
          created_at DATE,
          posted_at TIMESTAMP,
          archive_at TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'contact_form',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS contact_form(
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          received_at TIMESTAMP DEFAULT NOW( )
        )
      `,
    },
    {
      name: 'visitors',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS visitors 
        (
          uid SERIAL PRIMARY KEY,
          id VARCHAR(200) NOT NULL,
          ip VARCHAR(245) NOT NULL,
          user_agent VARCHAR(255) NOT NULL,
          fingerprint VARCHAR(255) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `,
    },
    {
      name: 'album_category',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS album_category (
          id SERIAL PRIMARY KEY,
          category_name varchar(255) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'album',
      dependencies: ['album_category'],
      definition: `
        CREATE TABLE IF NOT EXISTS album (
          id SERIAL PRIMARY KEY,
          category_name varchar(255) NOT NULL REFERENCES album_category(category_name),
          name VARCHAR(255),
          path varchar(255),
          a_id varchar(255) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'sms_messages',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS sms_messages (
          id SERIAL PRIMARY KEY,
          phone_number TEXT NOT NULL,
          message_text TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        )
      `,
    },
    {
      name: 'otps',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS otps (
          id SERIAL PRIMARY KEY,
          phone_number VARCHAR(20) NOT NULL UNIQUE,
          otp VARCHAR(6) NOT NULL,
          verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
    },
    {
      name: 'vidGallery',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS vidGallery (
          id SERIAL PRIMARY KEY,
          category_name TEXT NOT NULL,
          name TEXT NOT NULL,
          path TEXT NOT NULL
        )
      `,
    },
    {
      name: 'organization_course_assi',
      dependencies: ['organizations', 'courses', 'course_scheduler'],
      definition: `
        CREATE TABLE IF NOT EXISTS organization_course_assi (
          id SERIAL PRIMARY KEY,
          organization_name varchar(255) NOT NULL REFERENCES organizations(organization),
          course_id varchar(255) NOT NULL REFERENCES courses(course_id),
          organization_course_id varchar(255) NOT NULL,
          code varchar(255) NOT NULL,
          course_no varchar(255) NOT NULL,
          batch_no integer NOT NULL,
          scheduling_id varchar(255) NOT NULL REFERENCES course_scheduler(course_scheduler_id),
          date_commencement DATE NOT NULL,
          date_completion DATE NOT NULL,
          date_assigned DATE DEFAULT NOW()
        )
      `,
    },
    {
      name: 'enrolment',
      dependencies: ['course_scheduler', 'users'],
      definition: `
        CREATE TABLE IF NOT EXISTS enrolment (
          id SERIAL PRIMARY KEY,
          scheduling_id varchar(255) NOT NULL REFERENCES course_scheduler(course_scheduler_id),
          student_id varchar(255) NOT NULL REFERENCES users(student_id),
          course_paid_status BOOLEAN NOT NULL DEFAULT false,
          enrolment_status varchar(255) NOT NULL DEFAULT 'request',
          nigst_approval BOOLEAN NOT NULL DEFAULT false,
          enrolment_date DATE DEFAULT NOW(),
          enrolment_id varchar(255) NOT NULL
        )
      `,
    },
    {
      name: 'archive_enrolment',
      dependencies: ['course_scheduler', 'users'],
      definition: `
        CREATE TABLE IF NOT EXISTS archive_enrolment (
          id SERIAL PRIMARY KEY,
          scheduling_id varchar(255) NOT NULL,
          student_id varchar(255) NOT NULL,
          course_paid_status BOOLEAN NOT NULL,
          enrolment_status varchar(255) NOT NULL,
          nigst_approval BOOLEAN NOT NULL,
          enrolment_date DATE,
          archive_date DATE DEFAULT NOW(),
          enrolment_id varchar(255) NOT NULL
        )
      `,
    },
    {
      name: 'archive_enroll',
      dependencies: ['course_scheduler', 'users'],
      definition: `
        CREATE TABLE IF NOT EXISTS archive_enroll (
          id SERIAL PRIMARY KEY,
          scheduling_id varchar(255) NOT NULL REFERENCES course_scheduler(course_scheduler_id),
          student_id varchar(255) NOT NULL REFERENCES users(student_id),
          course_paid_status BOOLEAN NOT NULL DEFAULT false,
          enrolment_status varchar(255) NOT NULL DEFAULT 'request',
          nigst_approval BOOLEAN NOT NULL DEFAULT false,
          enrolment_date DATE DEFAULT NOW(),
          enrolment_id varchar(255) NOT NULL,
          cancel_date DATE DEFAULT NOW()
        )
      `,
    },
    {
      name: 'tender',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS tender (
          id SERIAL PRIMARY KEY,
          title varchar(255) NOT NULL,
          description text,
          start_date date NOT NULL,
          end_date date NOT NULL,
          attachment varchar(255) NOT NULL,
          tender_ref_no varchar(255) NOT NULL UNIQUE
        )
      `,
    },
    {
      name: 'archive_tender',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS archive_tender (
          id SERIAL PRIMARY KEY,
          title varchar(255) NOT NULL,
          description text,
          start_date date NOT NULL,
          end_date date NOT NULL,
          attachment varchar(255) NOT NULL,
          tender_ref_no varchar(255) NOT NULL
        )
      `,
    },
    {
      name: 'corrigendum_tender',
      dependencies: ['tender'],
      definition: `
        CREATE TABLE IF NOT EXISTS corrigendum_tender (
          id SERIAL PRIMARY KEY,
          corrigendum text,
          attachment varchar(255),
          tender_ref_no varchar(255) NOT NULL,
          corri_id varchar(255) NOT NULL UNIQUE,
          created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tender_ref_no) REFERENCES tender(tender_ref_no)
        )
      `,
    },
    {
      name: 'archive_corrigendum',
      dependencies: ['tender'],
      definition: `
        CREATE TABLE IF NOT EXISTS archive_corrigendum (
          id SERIAL PRIMARY KEY,
          corrigendum text,
          attachment varchar(255),
          tender_ref_no varchar(255),
          corri_id varchar(255) UNIQUE,
          created_at TIMESTAMP,
          archived_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
    },
    {
      name: 'report_submission',
      dependencies: ['faculty', 'course_scheduler'],
      definition: `
        CREATE TABLE IF NOT EXISTS report_submission (
          id SERIAL PRIMARY KEY,
          faculty_id varchar(255) REFERENCES faculty(faculty_id),
          remarks text,
          report_path varchar(255),
          faculty varchar(255) REFERENCES faculty_name(name),
          schedule_id varchar(255) REFERENCES course_scheduler(course_scheduler_id),
          submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_schedule_submission UNIQUE (schedule_id, faculty_id)
        )
      `,
    },
    {
      name: 'banner',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS banner (
          id SERIAL PRIMARY KEY,
          name varchar(255),
          alt varchar(255),
          banner_path varchar(255),
          banner_id varchar(255) NOT NULL UNIQUE,
          url varchar(255),
          date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
    },
    {
      name: 'header',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS header (
          id SERIAL PRIMARY KEY,
          h_id varchar(255),
          h_name varchar(255),
          h_path varchar(255),
          url varchar(255),
          visibility BOOLEAN DEFAULT FALSE,
          date TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'footer',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS footer (
          id SERIAL PRIMARY KEY,
          name varchar(255),
          link varchar(255),
          type varchar(255) NOT NULL,
          footer_id varchar(255) NOT NULL UNIQUE,
          phone varchar(255),
          email varchar(255),
          address text,
          visibile boolean DEFAULT false,
          date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
    },
    {
      name: 'soi_project',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS soi_project (
          id SERIAL PRIMARY KEY,
          p_id varchar(255),
          p_name varchar(255),
          p_description text,
          visibility BOOLEAN DEFAULT FALSE,
          url varchar(255) NOT NULL,
          path varchar(255),
          date TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'office',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS office (
          id SERIAL PRIMARY KEY,
          o_id varchar(255),
          office_name varchar(255) UNIQUE,
          office_email varchar(255) NOT NULL,
          visibility BOOLEAN DEFAULT FALSE,
          date DATE
        )
      `,
    },
    {
      name: 'marquee',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS marquee (
          id SERIAL PRIMARY KEY,
          marquee_id varchar(255),
          marquee_status BOOLEAN DEFAULT FALSE,
          info TEXT,
          url varchar(255),
          color varchar(30),
          text_color varchar(30),
          web_visibility BOOLEAN DEFAULT FALSE,
          date_creation DATE
        )
      `,
    },
    {
      name: 'home_carousel',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS home_carousel (
          id SERIAL PRIMARY KEY,
          c_id varchar(255),
          c_status BOOLEAN DEFAULT FALSE,
          name varchar(255),
          path varchar(255),
          upload_date DATE
        )
      `,
    },
    {
      name: 'social_media',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS social_media (
          id SERIAL PRIMARY KEY,
          sm_id varchar(255),
          icon_name varchar(255) NOT NULL UNIQUE,
          url varchar(255),
          visibility BOOLEAN DEFAULT FALSE,
          date TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'about_section',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS about_section (
          id SERIAL PRIMARY KEY,
          a_id varchar(255),
          a_name varchar(255),
          path varchar(255),
          a_description text,
          visibility BOOLEAN DEFAULT FALSE,
          date TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'campus',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS campus (
          id SERIAL PRIMARY KEY,
          c_id varchar(255),
          c_description text,
          path varchar(255),
          visibility BOOLEAN DEFAULT FALSE,
          date TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'sports_facility',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS sports_facility (
          id SERIAL PRIMARY KEY,
          s_id varchar(255),
          s_description text,
          path varchar(255),
          visibility BOOLEAN DEFAULT FALSE,
          date TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'nigst_hostel',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS nigst_hostel (
          id SERIAL PRIMARY KEY,
          h_id varchar(255),
          h_description text,
          path varchar(255),
          visibility BOOLEAN DEFAULT FALSE,
          date TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'board_of_governance',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS board_of_governance (
          id SERIAL PRIMARY KEY,
          g_id varchar(255),
          g_name varchar(255),
          g_designation varchar(255),
          g_position varchar(255),
          path varchar(255),
          visibility BOOLEAN DEFAULT FALSE,
          date TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'board_of_Evaluation',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS board_of_Evaluation (
          id SERIAL PRIMARY KEY,
          g_id varchar(255),
          g_name varchar(255),
          g_designation varchar(255),
          g_position varchar(255),
          path varchar(255),
          visibility BOOLEAN DEFAULT FALSE,
          date TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'board_of_studies',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS board_of_studies (
          id SERIAL PRIMARY KEY,
          g_id varchar(255),
          g_name varchar(255),
          g_designation varchar(255),
          g_position varchar(255),
          path varchar(255),
          visibility BOOLEAN DEFAULT FALSE,
          date TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'about_section_image',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS about_section_image (
          id SERIAL PRIMARY KEY,
          a_id varchar(255) NOT NULL UNIQUE,
          path varchar(255),
          visibility BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: 'blocked_users',
      dependencies: [],
      definition: `
        CREATE TABLE IF NOT EXISTS blocked_users (
          id SERIAL PRIMARY KEY,
          ip varchar(255) NOT NULL UNIQUE,
          blocked_until TIMESTAMP NOT NULL,
          reason varchar(255)
        )
      `,
    },
  ];

  
  const sortedTables = [];
  const visited = {};

  const visit = async (table) => {
    if (!visited[table.name]) {
      visited[table.name] = true;
      for (const dependency of table.dependencies) {
        const dependentTable = tables.find((t) => t.name === dependency);
        await visit(dependentTable);
      }
      sortedTables.push(table);
    }
  };

  for (const table of tables) {
    await visit(table);
  }

  let client;

  try {
    client = await pool.connect();

    for (const table of sortedTables) {
      await client.query(table.definition);
      // console.log(`Table '${table.name}' created successfully`);
    }

    console.log('All tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    if (client) {
      await client.release();
    }
  }
};

module.exports = { createTables };

