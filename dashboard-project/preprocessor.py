import pandas as pd
import numpy as np
import re
from typing import Dict, Any, Tuple, List

class AutoPreprocessor:
    """
    Automated data cleaning and preprocessing pipeline.
    Handles missing values, duplicates, type detection, and normalization.
    """
    
    @staticmethod
    def process(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Execute the full preprocessing pipeline.
        Returns the cleaned dataframe and a summary of actions taken.
        """
        initial_rows = len(df)
        actions = []
        
        # 1. Remove Duplicates
        df = df.drop_duplicates()
        if len(df) < initial_rows:
            actions.append(f"Removed {initial_rows - len(df)} duplicate rows")
            
        # 2. Smart Column Dropping (Irrelevant columns)
        # Drop columns with 100% missing values
        all_missing = df.columns[df.isnull().all()].tolist()
        if all_missing:
            df = df.drop(columns=all_missing)
            actions.append(f"Dropped empty columns: {', '.join(all_missing)}")
            
        # 3. Type Detection & Conversion
        for col in df.columns:
            # Try to convert to datetime if column contains 'date' or 'time'
            if re.search(r'date|time|timestamp', col, re.I):
                try:
                    df[col] = pd.to_datetime(df[col], errors='coerce')
                    actions.append(f"Converted '{col}' to datetime")
                    continue
                except:
                    pass
            
            # Clean numeric columns that might be stored as strings with currencies/commas
            if df[col].dtype == 'object':
                sample_val = str(df[col].dropna().iloc[0]) if not df[col].dropna().empty else ""
                if re.search(r'^[\$\£\€\d,.-]+$', sample_val):
                    clean_series = df[col].astype(str).str.replace(r'[^\d.-]', '', regex=True)
                    try:
                        df[col] = pd.to_numeric(clean_series, errors='coerce')
                        actions.append(f"Cleaned and converted '{col}' to numeric")
                    except:
                        pass

        # 4. Handle Missing Values (Imputation)
        for col in df.columns:
            missing_count = df[col].isnull().sum()
            if missing_count > 0:
                if df[col].dtype in ['int64', 'float64']:
                    df[col] = df[col].fillna(df[col].median())
                    actions.append(f"Imputed {missing_count} values in numeric '{col}' using median")
                else:
                    df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "Unknown")
                    actions.append(f"Imputed {missing_count} values in categorical '{col}' using mode")

        # 5. String Normalization
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = df[col].astype(str).str.strip().str.title()
            
        summary = {
            "initial_rows": initial_rows,
            "final_rows": len(df),
            "columns": df.columns.tolist(),
            "actions": actions,
            "badge": "Dataset Optimized"
        }
        
        return df, summary

    @staticmethod
    def get_insights(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate automated insights (Anomalies, Correlations, etc.)
        """
        numeric_df = df.select_dtypes(include=[np.number])
        insights = {
            "summary": "AI Analysis Complete. Detected patterns and correlations within the dataset.",
            "talking_points": [],
            "anomalies": [],
            "correlations": []
        }
        
        # 1. Correlations
        if len(numeric_df.columns) >= 2:
            corr_matrix = numeric_df.corr()
            strong_corr = []
            for i in range(len(corr_matrix.columns)):
                for j in range(i):
                    val = corr_matrix.iloc[i, j]
                    if abs(val) > 0.7:
                        strong_corr.append({
                            "columns": [corr_matrix.columns[i], corr_matrix.columns[j]],
                            "value": round(val, 2)
                        })
            insights["correlations"] = strong_corr
            if strong_corr:
                insights["talking_points"].append(f"Strong correlation found between {strong_corr[0]['columns'][0]} and {strong_corr[0]['columns'][1]}.")

        # 2. Basic Anomaly Detection (Z-Score based for speed)
        for col in numeric_df.columns:
            mean = df[col].mean()
            std = df[col].std()
            if std > 0:
                anomalies = df[abs((df[col] - mean) / std) > 3]
                if not anomalies.empty:
                    insights["anomalies"].append(f"Detected {len(anomalies)} outliers in '{col}'")
        
        # 3. Recommendations
        insights["recommendations"] = [
            "Focus marketing efforts on high-correlation segments.",
            "Investigate detected anomalies to prevent data leakage or operational risks.",
            "Automate periodic reporting for key trend stability."
        ]
        
        return insights
